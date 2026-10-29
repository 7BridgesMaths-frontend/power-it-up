import { SymbolView } from "../symbols";

export const BLANK_ID = -1;
const OVERSHOOT_RATIO = 0.06;
const SPAWN_DURATION = 500;

export default class CellView {
    constructor({ scene, model, reel, row, rowSpacing, reelsConfig, id = BLANK_ID, value = null, spinCount = 8, fillerIds = [BLANK_ID], shouldLock, onSymbolCreated, onSymbolLanding, stickyLayer = null }) {
        this.scene = scene;
        this.model = model;
        this.reel = reel;
        this.row = row;
        this.rowSpacing = rowSpacing;
        this.reelsConfig = reelsConfig;
        this.spinCount = spinCount;
        this.fillerIds = fillerIds;
        this.shouldLock = shouldLock;
        this.onSymbolCreated = onSymbolCreated;
        this.onSymbolLanding = onSymbolLanding;
        this.stickyLayer = stickyLayer;

        this.container = this.scene.add.container(0, 0);
        this.content = this.scene.add.container(0, 0);
        this.container.add(this.content);

        this.symbol = null;
        this.symbolId = BLANK_ID;
        this.incomingSymbol = null;
        this.incomingId = BLANK_ID;
        this.extraSymbols = [];

        this.locked = false;
        this.isSpinning = false;
        this.hasPendingSpin = false;
        this.spinTween = null;
        this.maskShape = null;
        this._spinResolve = null;

        this.setSymbol({ id, value });
    }

    getContainer() {
        return this.container;
    }

    getSymbol() {
        return this.symbol;
    }

    getId() {
        return this.symbolId;
    }

    isBlank() {
        return this.symbolId === BLANK_ID;
    }

    setPosition(x, y) {
        this.container.setPosition(x, y);
    }

    lock() {
        this.locked = true;
        this._syncSticky();
    }

    unlock() {
        this.locked = false;
        this._syncSticky();
    }

    // Locked symbols leave the masked content so they aren't clipped and read as settled
    _syncSticky() {
        if (!this.stickyLayer || !this.symbol) return;

        const symbolContainer = this.symbol.getContainer();
        const shouldLift = this.locked && !this.isSpinning;
        if (shouldLift === (symbolContainer.parentContainer === this.stickyLayer)) return;

        if (shouldLift) {
            this.stickyLayer.add(symbolContainer);
            symbolContainer.setPosition(this.container.x, this.container.y);
        } else {
            this.content.add(symbolContainer);
            symbolContainer.setPosition(0, 0);
        }
    }

    setMaskRect({ x, y, width, height }, debugAlpha = 0) {
        this.clearMask();

        this.maskShape = this.scene.add.graphics();
        this.maskShape.fillStyle(0xFF0000, debugAlpha);
        this.maskShape.fillRect(x, y, width, height);

        this.container.setMask(this.maskShape.createGeometryMask());
    }

    clearMask() {
        if (!this.maskShape) return;

        this.container.clearMask(true);
        this.maskShape.destroy();
        this.maskShape = null;
    }

    _createSymbol({ id, y, value = null, filler = false }) {
        if (id === BLANK_ID || id === null || id === undefined) return null;

        const symbolView = new SymbolView({
            scene: this.scene,
            model: this.model,
            index: this.row,
            id,
            reelsConfig: this.reelsConfig,
        });

        if (!filler) {
            if (value) symbolView.addValueLabel(value);
            this.onSymbolCreated?.(symbolView, this);
        }

        symbolView.setPosition(0, y);
        this.content.add(symbolView.getContainer());
        return symbolView;
    }

    setSymbol({ id = BLANK_ID, value = null } = {}) {
        this.clearSymbols();
        this.symbolId = id ?? BLANK_ID;
        this.symbol = this._createSymbol({ id: this.symbolId, value, y: 0 });
        this._refreshLock();
        this._syncSticky();
    }

    setValue(value) {
        if (!this.symbol) return;
        this.symbol.destroyValuelabel();
        if (value) this.symbol.addValueLabel(value);
    }

    async changeSymbol({ id, value = null }) {
        if (!this.symbol) {
            this.setSymbol({ id, value });
        } else {
            this.symbol.destroyValuelabel();
            this.symbol.changeView(id);
            this.symbolId = id;
            if (value) this.symbol.addValueLabel(value);
            this._refreshLock();
            this._syncSticky();
        }

        if (!this.symbol) return;
        this.symbol.growAnimation(0);
        await new Promise(resolve => this.scene.time.delayedCall(SPAWN_DURATION, resolve));
    }

    _refreshLock() {
        if (!this.shouldLock) return;
        this.locked = this.symbolId !== BLANK_ID && !!this.shouldLock(this.symbolId);
    }

    addNewSymbol({ id = BLANK_ID, value = null } = {}) {
        if (this.isSpinning) this.stopSpin();
        this._discardPending();

        for (let k = 1; k <= this.spinCount; k++) {
            const fillerId = Phaser.Utils.Array.GetRandom(this.fillerIds);
            const filler = this._createSymbol({ id: fillerId, y: -k * this.rowSpacing, filler: true });
            if (filler) this.extraSymbols.push(filler);
        }

        this.incomingId = id ?? BLANK_ID;
        this.incomingSymbol = this._createSymbol({ id: this.incomingId, value, y: -(this.spinCount + 1) * this.rowSpacing });
        this.hasPendingSpin = true;
    }

    _discardPending() {
        this.extraSymbols.forEach(symbol => symbol.destroy());
        this.extraSymbols = [];

        this.incomingSymbol?.destroy();
        this.incomingSymbol = null;
        this.incomingId = BLANK_ID;

        this.hasPendingSpin = false;
    }

    animateSpin({ delay = 0, speedMultiplier = 1 } = {}) {
        if (!this.hasPendingSpin) return Promise.resolve();

        this.hasPendingSpin = false;
        this.isSpinning = true;
        this._syncSticky();

        const steps = this.spinCount + 1;
        const finalY = this.rowSpacing * steps;
        const overshoot = this.rowSpacing * OVERSHOOT_RATIO;
        const duration = (400 + steps * 70) / speedMultiplier;

        return new Promise(resolve => {
            this._spinResolve = resolve;

            this.spinTween = this.scene.tweens.chain({
                targets: this.content,
                tweens: [
                    {
                        y: finalY + overshoot,
                        delay,
                        duration,
                        ease: 'Sine.InOut',
                        onComplete: () => {
                            if (this.incomingSymbol) this.onSymbolLanding?.(this.incomingSymbol, this);
                        },
                    },
                    { y: finalY, duration: 120 / speedMultiplier, ease: 'Sine.Out' },
                ],
                onComplete: () => {
                    this.spinTween = null;
                    this._finishSpin();
                },
            });
        });
    }

    stopSpin() {
        if (!this.isSpinning) return;

        this.clearTweens();
        this._finishSpin();
    }

    _finishSpin() {
        if (!this.isSpinning) return;

        this.isSpinning = false;

        this.symbol?.destroy();
        this.extraSymbols.forEach(symbol => symbol.destroy());
        this.extraSymbols = [];

        this.symbol = this.incomingSymbol;
        this.symbolId = this.incomingId;
        this.incomingSymbol = null;
        this.incomingId = BLANK_ID;

        this.symbol?.setPosition(0, 0);
        this.content.y = 0;
        this._refreshLock();
        this._syncSticky();

        const resolve = this._spinResolve;
        this._spinResolve = null;
        resolve?.();
    }

    clearTweens() {
        if (!this.spinTween) return;
        this.spinTween.stop();
        this.spinTween = null;
    }

    clearSymbols() {
        this.clearTweens();

        this.symbol?.destroy();
        this.symbol = null;
        this.symbolId = BLANK_ID;
        this._discardPending();

        this.content.y = 0;
        this.isSpinning = false;
        this.locked = false;

        const resolve = this._spinResolve;
        this._spinResolve = null;
        resolve?.();
    }

    destroy() {
        this.clearSymbols();
        this.clearMask();
        this.container.destroy();
    }
}
