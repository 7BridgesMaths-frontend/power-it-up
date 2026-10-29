import { SYMBOLS_TO_GROW, SYMBOLS_TO_SHAKE } from "../../constants/IDs";
import { Model, ResponsiveManager } from "../../core";
import { DebugPanel } from "../../utils";
import { drawBounds } from "../../utils/drawBounds";
import { ensureSymbolAnim, getSymbolAnim, getSymbolAnimKey, getSymbolAnimMode, getSymbolAnimFirstFrame, isSymbolAnimDebug, getStopOnSpin, getHoldLastFrame } from "./symbolAnims";

export default class SymbolView extends Phaser.Events.EventEmitter {

    // Turned off while an overlay (e.g. the bonus buy store) is open,
    // so clicks on it don't open the payout modal of the symbol underneath
    static paytableEnabled = true;

    static disablePaytable() {
        SymbolView.paytableEnabled = false;
        SymbolView.activeModal?.closeModal();
    }

    static enablePaytable() {
        SymbolView.paytableEnabled = true;
    }

    constructor({scene, model, index, id, enterAnim = false, horizonalPos = false, reelsConfig}) {
        super();

        /** @type {Phaser.Scene} */
        this.scene = scene;
        /** @type {Model} */
        this.model = model;
        this.index = index;
        this.id = id;
        this.reelsConfig = reelsConfig;
        this.container = this.scene.add.container(0,0);
        this._createWinBorder()
        this.createView();
    }

    // -------------------
    // GETTERS & SETTERS
    // -------------------
     
    getId(){
        return this.id
    }

    getPosition(){
        return {x: this.container.x, y: this.container.y}
    }

    getContainer(){
        return this.container
    }

    setPosition(x, y){
        this.container.setX(x)
        this.container.setY(y)
    }

    refreshScale() {
        const reelsConfig = this.reelsConfig ?? ResponsiveManager.getForScene(this.scene)?.get('reels') ?? {};

        if (reelsConfig.symbolScale === undefined) {
            this.initialScale = 0.6;
            this.view.setScale(this.initialScale);
            this.view.setPosition(this.view.displayWidth * 0.5, this.view.displayHeight * 0.5);
            return;
        }

        const symbolSize = reelsConfig.symbolSize ?? this.model.getSymbolSize();
        this.initialScale = symbolSize / this.view.frame.width * reelsConfig.symbolScale;
        this.view.setScale(this.initialScale);
        this.view.setPosition(symbolSize / 2, symbolSize / 2);
    }

    // -------------------
    // CREATE ELEMENTS
    // -------------------

    createView() {
        let symName = 'sym_' + this.id;
        this.view = this.scene.add.sprite(0, 0, 'symbols', symName);
        this.refreshScale();
        this.view.setOrigin(0.5);

        this.view.setInteractive({ useHandCursor: true, pixelPerfect: true });
        this.view.on('pointerup', () => {
            if (!SymbolView.paytableEnabled) return;
            this.openModal();
        });

        this.container.add(this.view);

        if (this.model.getDebugMode()) {
            this.debug = this.scene.add.text(0, 0, this.id, { font: "bold 60pt Arial", fill: "#F00" });
            this.container.add(this.debug);
        }
    }

    // -------------------
    // PAYTABLE MODAL
    // -------------------

    openModal() {
        const scene = this.scene;

        const data = this.model.getSymbolPayout(this.id);
        const counts = Object.keys(data).sort((a, b) => a - b);

        if (counts.length === 0) {
            return;
        }

        const ctor = this.constructor;

        if (ctor.activeModal && ctor.activeModal !== this) {
            ctor.activeModal.closeModal();
        }

        const radius = 16;
        const paddingX = 16;
        const paddingY = 32;
        const rowSpacing = 34;

        const worldMatrix = this.container.getWorldTransformMatrix();
        const decomposed = worldMatrix.decomposeMatrix();
        const panelX = decomposed.translateX;
        const panelY = decomposed.translateY + this.view.displayHeight * 0.5 * decomposed.scaleY;
        const scaleFactor = decomposed.scaleX;

        const baseFontSize = 24;
        const scaledFontSize = Math.round(baseFontSize * scaleFactor);

        const labelStyle = { font: `${scaledFontSize}px Arial`, fill: "#ffffff" };
        const amountStyle = { font: `bold ${scaledFontSize}px Arial`, fill: "#ffffff" };

        const rowPairs = counts.map((count) => ({
            label: `${count}: `,
            amountText: `${data[count]}x`,
        }));

        const measurer = scene.add.text(0, 0, '', labelStyle).setVisible(false);
        let maxContentWidth = 0;
        const widths = rowPairs.map(({ label, amountText }) => {
            measurer.setStyle(labelStyle);
            measurer.setText(label);
            const labelWidth = measurer.width;

            measurer.setStyle(amountStyle);
            measurer.setText(amountText);
            const amountWidth = measurer.width;

            maxContentWidth = Math.max(maxContentWidth, labelWidth + amountWidth);
            return { labelWidth, amountWidth };
        });
        measurer.destroy();

        const panelWidth = Math.max(100, maxContentWidth + paddingX * 2);
        const panelHeight = Math.max(80, paddingY * 2 + (counts.length - 1) * rowSpacing + 24);

        this.modalPanelRect = { x: panelX, y: panelY, w: panelWidth, h: panelHeight, scale: scaleFactor };

        this.modalContainer = scene.add.container(panelX, panelY).setDepth(1000);
        this.modalContainer.setScrollFactor(0);

        // Starts at scale 0 and transparent to animate the entrance
        this.modalContainer.setScale(0);
        this.modalContainer.setAlpha(0);

        const panel = scene.add.graphics();
        panel.fillStyle(0x000000, 0.8);
        panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
        panel.lineStyle(2, 0xcccccc, 1);
        panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);

        const panelHitArea = scene.add.rectangle(0, 0, panelWidth, panelHeight, 0xffffff, 0.001);
        panelHitArea.setInteractive();
        panelHitArea.on('pointerup', (pointer, localX, localY, event) => {
            event.stopPropagation();
        });

        this.modalContainer.add([panel, panelHitArea]);
        this.modalRows = [];

        this.outsideClickHandler = (pointer) => {
            const scaledW = panelWidth * scaleFactor;
            const scaledH = panelHeight * scaleFactor;
            const b = new Phaser.Geom.Rectangle(panelX - scaledW / 2, panelY - scaledH / 2, scaledW, scaledH);
            if (!b.contains(pointer.x, pointer.y)) {
                this.closeModal();
            }
        };
        scene.input.on('pointerdown', this.outsideClickHandler);

        ctor.activeModal = this;

        this.renderModalContent(rowPairs, widths, maxContentWidth, labelStyle, amountStyle);

        // Entrance animation: pop-in with a slight overshoot
        scene.tweens.add({
            targets: this.modalContainer,
            scale: scaleFactor,
            alpha: 1,
            duration: 220,
            ease: 'Back.Out'
        });
    }

    renderModalContent(rowPairs, widths, maxContentWidth, labelStyle, amountStyle) {
        const rowSpacing = 34;
        const scaleFactor = this.modalPanelRect.scale;

        const totalHeight = (rowPairs.length - 1) * rowSpacing;
        const startY = -totalHeight / 2;
        const blockX = -maxContentWidth / 2;

        rowPairs.forEach(({ label, amountText }, i) => {
            const y = startY + i * rowSpacing;

            const labelObj = this.scene.add.text(blockX, y, label, labelStyle)
                .setOrigin(0, 0.5)
                .setScale(1 / scaleFactor);

            const amountObj = this.scene.add.text(blockX + widths[i].labelWidth, y, amountText, amountStyle)
                .setOrigin(0, 0.5)
                .setScale(1 / scaleFactor);

            this.modalContainer.add([labelObj, amountObj]);
            this.modalRows.push(labelObj, amountObj);
        });
    }

    closeModal() {
        if (!this.modalContainer) return;

        const containerToDestroy = this.modalContainer;
        // Prevents openModal from reusing it while the exit animation runs
        this.modalContainer = null;

        if (this.outsideClickHandler) {
            this.scene.input.off('pointerdown', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }
        if (this.constructor.activeModal === this) {
            this.constructor.activeModal = null;
        }
        this.modalRows = null;
        this.modalPanelRect = null;

        // Exit animation: destroy only once it finishes
        this.scene.tweens.add({
            targets: containerToDestroy,
            scale: 0,
            alpha: 0,
            duration: 150,
            ease: 'Back.In',
            onComplete: () => {
                containerToDestroy.destroy();
            }
        });
    }

    _createWinBorder() {
        this.winBorder = this.scene.add.sprite(0, 0, 'symbols', 'border')
            .setOrigin(0)
            .setAlpha(0);

        this.container.add(this.winBorder);
    }
    
    // -------------------
    // APPEARANCE
    // -------------------

    addValueLabel(value){
        if (!value) return
        if (!this.valueLabel){
            this.valueLabel = this.scene.add.text(75,78, value, { font: "bold 34px Arial", fill: "#fff",stroke:"#000",strokeThickness:5, align: 'center'});
        }
        this.valueLabel.setOrigin(0.5);
        this.container.add(this.valueLabel);
    }

    changeValueLabel(value){
        if (!value || !this.valueLabel) return
        this.valueLabel.setText(value)
    }

    destroyValuelabel(){
        if (this.valueLabel){
            this.valueLabel?.destroy()
            this.valueLabel = null
        }
    }

    changeView(newId){
        // The open modal would show the payouts of the previous symbol
        this.closeModal();
        this.stopSymbolAnim();
        this.view.setFrame("sym_"+newId);
        this.debug?.setText(newId)
        this.id = newId;
    }

    // -------------------
    // ANIMATIONS
    // -------------------
    
    growAnimation(delay, scale = 0.25){
        this.scene.tweens.add({
            targets: this.view,
            delay,
            scale: `+=${scale}`,
            ease: 'Sine.InOut',
            duration: 250,
            yoyo: true,
        })
    }

    shakeAnimation(delay = 0, strength = 10){
        this.scene.tweens.add({
            targets: this.view,
            delay,
            angle: -(strength),
            duration: 90,
            ease: 'Sine.Out',
            yoyo: true,
            repeat: 1
        });
    }
    
    playPulse(duration = 300) {
        this.view.setAlpha(1);
        this.view.clearTint();

        if (this.playWinAnim()) {
            return new Promise(resolve => {
                this.winTween = this.scene.tweens.add({
                    targets: this.animView,
                    scale: this.animBaseScale * 1.06,
                    yoyo: true,
                    duration: duration / 2,
                    ease: 'Sine.InOut',
                    onComplete: resolve
                });
            });
        }

        return new Promise(resolve => {
            this.winTween = this.scene.tweens.add({
                targets: this.view,
                scale: this.initialScale + 0.1,
                yoyo: true,
                duration: duration / 2,
                ease: 'Sine.InOut',
                onComplete: resolve
            });
        });
    }

    async resetVisual(){
        this._stopAnimOnSpin();
        await this.stopDim()
        await this.stopPulse();
        this.stopBorder();
    }

    stopPulse(dim = false) {
        if (!this.winTween) return
        
        this.winTween.stop();
        this.winTween = null;
        this.animView?.setScale(this.animBaseScale);
        
        if (dim){
            this._visualTargets().forEach(v => v.setAlpha(0.6).setTint(0x898989));
        }

        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.view,
                scale: this.initialScale,
                duration: 250,
                ease: 'Sine.InOut',
                onComplete: resolve
            });
        });
    }

    _delay(ms) {
        return new Promise(resolve => {
            this.scene.time.delayedCall(ms, resolve, null, this);
        });
    }

    showBorder() {
        this._visualTargets().forEach(v => v.setAlpha(1).clearTint());
        this.winBorder.setAlpha(1);
    }

    stopBorder(dim = false) {
        if (dim){
            this._visualTargets().forEach(v => v.setAlpha(0.6).setTint(0x898989));
        }
        this.winBorder.setAlpha(0);
    }

    dim() {
        const targets = this._visualTargets();
        this.dimTween = this.scene.tweens.add({
            targets,
            alpha: 0.6,
            duration: 150
        });

        targets.forEach(v => v.setTint(0x898989));
    }

    stopDim(){
        if (!this.dimTween) return
        this.dimTween.stop();
        this.dimTween = null;
        
        const targets = this._visualTargets();
        targets.forEach(v => v.clearTint());
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets,
                alpha: 1,
                duration: 250,
                ease: 'Sine.InOut',
                onComplete: () => {
                    resolve()
                }
            });
        });
    }

    animBlink(){
        this.tween = this.scene.tweens.add( {targets: this.container, alpha: 0 , ease: 'Linear', duration: 150, yoyo:true,repeat:2 });
    }

    hasSymbolAnim() {
        return ensureSymbolAnim(this.scene, this.id);
    }

    get activeView() {
        return this.isAnimPlaying ? this.animView : this.view;
    }

    _visualTargets() {
        return this.animView ? [this.view, this.animView] : [this.view];
    }

    playLandAnim() {
        const mode = getSymbolAnimMode(this.id, 'onLand');
        if (mode === 'none') return false;
        return this._playAtlasAnim({ loop: mode === 'loop', reason: 'land' });
    }

    playWinAnim() {
        const mode = getSymbolAnimMode(this.id, 'onWin');
        if (mode === 'none') return false;
        return this._playAtlasAnim({ loop: mode === 'loop', reason: 'win' });
    }

    _createAnimView(key, frameName) {
        this.animView = this.scene.add.sprite(0, 0, key, frameName).setOrigin(0.5);
        this.container.addAt(this.animView, this.container.getIndex(this.view) + 1);

        this.animView.setInteractive({ useHandCursor: true, pixelPerfect: true });
        this.animView.on('pointerup', () => {
            if (!SymbolView.paytableEnabled) return;
            this.openModal();
        });

        this.animView.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (!this.isAnimPlaying) return;

            if (getHoldLastFrame(this.id)) {
                if (isSymbolAnimDebug()) {
                    console.log(`[symbolAnims] sym_${this.id} (fila ${this.index}) HOLD ${this.animReason} en el último frame`);
                }
                return;
            }

            this.stopSymbolAnim();
        });
    }

    _playAtlasAnim({ loop, reason }) {
        if (!this.hasSymbolAnim()) return false;

        if (isSymbolAnimDebug()) {
            console.log(`[symbolAnims] sym_${this.id} (fila ${this.index}) PLAY ${reason} ${loop ? 'loop' : 'once'}` +
                (this.isAnimPlaying ? ` (ya reproducía: ${this.animReason}, frame ${this.animView.anims.currentFrame?.index})` : ''));
        }

        const cfg = getSymbolAnim(this.id);
        const key = getSymbolAnimKey(this.id);
        const repeat = loop ? -1 : 0;

        if (this.isAnimPlaying) {
            if (this.animReason === reason) return true;

            const anims = this.animView.anims;
            const total = anims.getTotalFrames();
            const next = anims.currentFrame ? anims.currentFrame.index % total : 0;
            this.animReason = reason;
            this.animView.play({ key, repeat, startFrame: next });
            if (reason === 'win') this._resetAnimVisual();
            return true;
        }

        const first = getSymbolAnimFirstFrame(this.scene, this.id);

        if (!this.animView) this._createAnimView(key, first.name);
        else this.animView.setTexture(key, first.name);

        const size = this.view.frame.realWidth * this.initialScale;
        this.animBaseScale = (size * cfg.scale) / first.realWidth;

        this.animView
            .setScale(this.animBaseScale)
            .setPosition(this.view.x + size * cfg.offsetX, this.view.y + size * cfg.offsetY)
            .setVisible(true);

        if (reason === 'win') {
            this._resetAnimVisual();
        } else {
            this.animView.setAlpha(this.view.alpha);
            if (this.view.isTinted) this.animView.setTint(this.view.tintTopLeft);
            else this.animView.clearTint();
        }

        this.animReason = reason;
        this.animView.play({ key, repeat });
        this.view.setVisible(false);
        this.isAnimPlaying = true;
        return true;
    }

    _resetAnimVisual() {
        this.animView.setAlpha(1).clearTint();
    }

    _stopAnimOnSpin() {
        if (!this.isAnimPlaying) return;

        const mode = getStopOnSpin();
        if (mode === 'all' || (mode === 'win' && this.animReason === 'win')) {
            this.stopSymbolAnim();
            return;
        }

        this.scene.tweens.killTweensOf(this.animView);
        this.animView.setScale(this.animBaseScale).setAlpha(1).clearTint();
    }

    stopSymbolAnim() {
        if (!this.isAnimPlaying) return;

        if (isSymbolAnimDebug()) {
            console.groupCollapsed(`[symbolAnims] sym_${this.id} (fila ${this.index}) STOP ${this.animReason} en frame ${this.animView.anims.currentFrame?.index}/${this.animView.anims.getTotalFrames()}`);
            console.trace();
            console.groupEnd();
        }

        this.isAnimPlaying = false;
        this.animReason = null;
        this.scene.tweens.killTweensOf(this.animView);
        this.animView.stop();
        this.animView.setVisible(false).setScale(this.animBaseScale);
        this.view.setVisible(true);
    }

    // -------------------
    // DESTROY
    // -------------------

    destroy() {
        if (this.tween) {
            this.tween.stop();
            this.tween = null
        }
        if (this.valueLabel) this.valueLabel.destroy();
        if (this.animView) {
            this.scene.tweens.killTweensOf(this.animView);
            this.animView.destroy();
            this.animView = null;
        }
        this.container.remove(this.view);
        this.view.destroy();
        this.container.destroy();
    }
}