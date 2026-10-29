import { Model, ResponsiveManager } from "../../core";
import { generateLineColors } from "../../utils/generateLinesColors";
import { getMaskRects, getSymbolCellBounds, resolveReelsLayout } from "../reels/reelsLayout";
import { isBackgroundMasked, layoutBackground, layoutFrame } from "../reels/reelsAttach";
import CascadeReelView from "./CascadeReelView";

export default class CascadeController {
    constructor({ scene, model }) {
        /** @type {Phaser.Scene} */
        this.scene = scene;
        /** @type {Model} */
        this.model = model;

        this.isPlayingWin = false;
        this.deleteCascadeSymbols = [];

        this._createBackground();

        this.reelsContainer = this.scene.add.container(0, 0).applyResponsive('cascade');

        /** @type {CascadeReelView[]} */
        this.reels = [];

        this._createReels();
        this._createLinesContainer();
        this._drawMask();
    }

    _getResponsiveConfig() {
        return ResponsiveManager.getForScene(this.scene)?.get('cascade') || {};
    }

    _getLayout() {
        return resolveReelsLayout(this.model, this._getResponsiveConfig());
    }

    _getSymbol({ position, reel }) {
        return this.reels[reel].symbols[position];
    }

    _drawMask() {
        this.maskShape = this.scene.add.graphics();
        this._fillMask();

        const mask = this.maskShape.createGeometryMask();
        this.reelsContainer.setMask(mask);
    }

    _fillMask() {
        const fillAlpha = this.model.getDebugMode() ? .1 : 0;
        this.maskShape.clear();
        this.maskShape.fillStyle(0xFF0000, fillAlpha);

        const cellBounds = getSymbolCellBounds(this.reels[0]?.symbols[0]?.view);
        getMaskRects(this._getLayout(), this.reelsContainer, cellBounds)
            .forEach(({ x, y, width, height }) => this.maskShape.fillRect(x, y, width, height));
    }

    _createBackground() {
        this.reelsBG = this.scene.add.sprite(0, 0, 'reelsBG').setOrigin(0);
    }

    _layoutBackground() {
        layoutBackground(this.scene, this.reelsBG, this._getResponsiveConfig());
    }

    _layoutFrame() {
        if (!this.reelsFrame) return;
        layoutFrame(this.scene, this.reelsFrame, this._getResponsiveConfig());
    }

    relayout() {
        this._layoutBackground();
        const config = this._getResponsiveConfig();
        const scaleX = config.scaleX ?? config.scale ?? 1;
        const scaleY = config.scaleY ?? config.scale ?? 1;

        this.reelsContainer.setPosition(config.x, config.y).setScale(scaleX, scaleY);
        this._layoutFrame();

        const layout = this._getLayout();
        this.reels.forEach((reelView, i) => {
            reelView.setPosition(layout.reels[i].x, layout.reels[i].y);
            reelView.symbols.forEach(symbol => {
                if (!symbol) return;
                symbol.rowSpacing = reelView._getRowSpacing();
                symbol.refreshScale();
                symbol.forcePosY();
            });
        });

        this._fillMask();
    }

    _createReels() {
        const layout = this._getLayout();

        if (isBackgroundMasked(this.scene)) this.reelsContainer.add(this.reelsBG);
        this._layoutBackground();

        for (let i = 0; i < this.model.getGrid().length; i++) {
            const reelView = this._createReelView(i);
            const { x, y } = layout.reels[i];
            reelView.setPosition(x, y);
            this.reelsContainer.add(reelView.getContainer());
            this.reels.push(reelView);
        }

        this.reelsFrame = this.scene.add.sprite(0, 0, 'reelsFrame')
            .setOrigin(0)
            .setDepth(1);
        this._layoutFrame();
    }

    _createReelView(index) {
        const reelHeight = this.model.getGrid()[index];
        const strip = this.model.getReelById(index);

        return new CascadeReelView({
            scene: this.scene,
            initialHeight: reelHeight,
            model: this.model,
            index,
            strip,
            spinCount: 3 + index,
            reelsConfig: this._getResponsiveConfig()
        });
    }

    _createLinesContainer() {
        this.linesContainer = this.scene.add.container(0, 0).setDepth(1);
    }

    getContainersToShowBorder() {
        const result = [this.reelsContainer];
        this.reels.forEach(reel => {
            result.push(reel.container);
        });
        return result;
    }

    async handleBasespin() {
        await this.makeSymbolsFallFromScreen();
        await this.addNewSymbols({ strip: this.lastResult.reelsSlices });
        await this.showNewSymbols({ steps: this.lastResult.reelsSlices.length * 6 });
    }

    async handleCascade() {
        await this.applyGravityToSymbols();
        await this.dropCascadeSymbols({ strip: this.lastResult.reelsSlices });
        this.resetQuickStop();
    }

    async makeSymbolsFallFromScreen() {
        const symbolsFallFromScreen = this.reels.map(async (reelView, i) => {
            let delay = 50 * i;
            return reelView.makeSymbolsFallFromScreen({ delay });
        });
        await Promise.all(symbolsFallFromScreen);
    }

    async addNewSymbols({ strip }) {
        const addNewSymbolsPromise = this.reels.map(async (reelView, i) => {
            return reelView.addNewSymbolsAboveTheScreen({ strip: strip[i] });
        });
        await Promise.all(addNewSymbolsPromise);
    }

    async showNewSymbols({ steps }) {
        const fallFromAbovePromises = [];
        for (let i = 0; i < this.reels.length; i++) {
            const reelView = this.reels[i];
            const delay = 50 * i;
            fallFromAbovePromises.push(reelView.fallSymbolsFromAboveScreen(delay, steps));
        }
        await Promise.all(fallFromAbovePromises);
    }

    async applyGravityToSymbols() {
        const fallPromises = this.reels.map(reel => reel.animateFallSymbols());
        await Promise.all(fallPromises);
    }

    async dropCascadeSymbols({ strip }) {
        const cascadePromises = this.reels.map((reel, i) =>
            reel.addCascadeSymbols(strip[i])
        );
        await Promise.all(cascadePromises);
    }

    resetQuickStop() {
        this.reels.forEach(reelView => {
            reelView.symbols.forEach(symbolView => {
                if (symbolView) symbolView.isQuickStop = false;
            });
        });
    }

    async destroyClusterSymbols() {
        const destroyPromises = [];
        for (let cluster of this.deleteCascadeSymbols) {
            const reel = this.reels[cluster.reel];
            destroyPromises.push(reel.animateDestroySymbol(cluster.row));
        }
        await Promise.all(destroyPromises);
    }

    async showLines({ prizes = [] }) {
        this.deleteCascadeSymbols = [];

        if (!prizes?.length) return;

        this.scene.sound.play('won', { volume: 0.04 });

        const symbolRefs = prizes.flatMap(prize => prize.symbols ?? prize);

        const animationPromises = symbolRefs.map(sym => {
            this.deleteCascadeSymbols.push({ reel: sym.reel, row: sym.position, reelset: 'main' });
            return this.reels[sym.reel].showWinnerSymbols(sym.position);
        });

        await Promise.all(animationPromises);
    }

    async playCascadeWinAnimations() {
        await this.delay(500);
        await this._handleCascadeAnimation();
    }

    async _handleCascadeAnimation() {
        await this.showLines({ prizes: this.lastResult.wonPrizes });
    }

    async playWaysAnimation({ wonPrizes, effects = [], duration, delayBetweenWays = 0 }) {
        if (effects.length == 0) return;

        const delay = (ms) => new Promise(res => {
            this._activeTimeout = setTimeout(res, ms);
        });

        this.isPlayingWin = true;
        while (this.isPlayingWin) {
            for (let group of wonPrizes) {
                if (!this.isPlayingWin) return;

                const symbols = group.symbols.map(p => this._getSymbol(p));

                await Promise.all(
                    effects.map(effect => effect(symbols, duration, delay))
                );

                await delay(delayBetweenWays);
            }
        }
    }

    dimNonWinning(wonPrizes) {
        const winning = new Set();

        wonPrizes.forEach(group => {
            group.symbols.forEach(p => {
                winning.add(this._getSymbol(p));
            });
        });

        this.reels.forEach(reel => {
            reel.symbols.forEach(sym => {
                if (sym && !winning.has(sym)) {
                    sym.dim();
                }
            });
        });
    }

    showAllBorders(wonPrizes) {
        const symbols = wonPrizes
            .flatMap(prize => prize.symbols)
            .map(p => this._getSymbol(p));

        symbols.forEach(s => s?.showBorder());
    }

    async resetWinAnimations() {
        this.isPlayingWin = false;
        clearTimeout(this._activeTimeout);
        this._activeTimeout = null;

        this.clearLines();

        const promises = this.reels.flatMap(reel => {
            reel.clearTweens();
            return reel.symbols.map(sym => sym?.resetVisual());
        });

        await Promise.all(promises);
    }

    clearLines() {
        this.linesContainer?.removeAll(true);
        this._lineGraphics = null;
        this.isPlayingWin = false;
    }

    reset() {
        this.isInCascade = false;
        this.cascadeLevel = 0;
        this.lastResult = null;
        this.isPlayingWin = false;
        clearTimeout(this._activeTimeout);
        this._activeTimeout = null;
        this.deleteCascadeSymbols = [];
    }

    setLastResult(result) {
        this.lastResult = result;
    }

    delay(ms) {
        return new Promise(resolve => {
            this.scene.time.delayedCall(ms, resolve, null, this);
        });
    }
}
