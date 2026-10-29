import { ResponsiveManager } from "../../core";
import { resolveReelsLayout } from "../reels/reelsLayout";
import CellView, { BLANK_ID } from "./CellView";

export default class CellsController {
    constructor({
        scene,
        model,
        strip = null,
        values = null,
        responsiveKey = 'reels',
        maskPadding = { x: 0, y: 0 },
        spinCount = 8,
        fillerIds,
        shouldLock,
        onSymbolCreated,
        onSymbolLanding,
        liftLockedSymbols = true,
        startHidden = false,
    }) {
        this.scene = scene;
        this.model = model;
        this.responsiveKey = responsiveKey;
        this.maskPadding = maskPadding;
        this.cellOptions = {
            spinCount,
            fillerIds: fillerIds ?? this._getDefaultFillerIds(),
            shouldLock,
            onSymbolCreated,
            onSymbolLanding,
        };

        this.isPlayingWin = false;
        this._fixedCells = new Set();

        this.cellsContainer = this.scene.add.container(0, 0).applyResponsive(this.responsiveKey);
        if (startHidden) this.cellsContainer.setAlpha(0);
        // Unmasked layer for locked symbols, added after the cells so it renders above them
        this.stickyLayer = liftLockedSymbols ? this.scene.add.container(0, 0) : null;
        this.cellOptions.stickyLayer = this.stickyLayer;

        this.cells = [];
        this._createCells(strip, this._normalizeValues(values));
        if (this.stickyLayer) this.cellsContainer.add(this.stickyLayer);
        this._drawMask();
    }

    _getResponsiveConfig() {
        return ResponsiveManager.getForScene(this.scene)?.get(this.responsiveKey) || {};
    }

    _getLayout() {
        return resolveReelsLayout(this.model, this._getResponsiveConfig());
    }

    _getDefaultFillerIds() {
        const ids = new Set();
        this.model.getGrid().forEach((_, reel) => {
            (this.model.getReelById(reel) ?? []).forEach(id => ids.add(id));
        });
        return ids.size ? [...ids] : [BLANK_ID];
    }

    getContainersToShowBorder() {
        const result = [this.cellsContainer];
        this.forEachCell(cell => result.push(cell.container));
        return result;
    }

    forEachCell(callback) {
        this.cells.forEach(reelCells => reelCells.forEach(callback));
    }

    getCell({ reel, row, position }) {
        return this.cells[reel]?.[row ?? position];
    }

    _getSymbol(coords) {
        return this.getCell(coords)?.getSymbol() ?? null;
    }

    getScreen() {
        return this.cells.map(reelCells => reelCells.map(cell => cell.getId()));
    }

    // -------------------
    // LOCKS
    // -------------------

    getFreeCells() {
        const result = [];
        this.forEachCell(cell => {
            if (!cell.locked) result.push({ reel: cell.reel, row: cell.row });
        });
        return result;
    }

    getLockedCount() {
        let count = 0;
        this.forEachCell(cell => { if (cell.locked) count++; });
        return count;
    }

    isBoardFull() {
        return this.getFreeCells().length === 0;
    }

    isLocked(coords) {
        return this.getCell(coords)?.locked ?? false;
    }

    lockCell(coords) {
        this.getCell(coords)?.lock();
    }

    unlockCell(coords) {
        this.getCell(coords)?.unlock();
    }

    fixSymbols(ids) {
        this.forEachCell(cell => {
            if (cell.locked || !ids.includes(cell.getId())) return;
            cell.lock();
            this._fixedCells.add(cell);
        });
    }

    clearFixedSymbols() {
        this._fixedCells.forEach(cell => cell.unlock());
        this._fixedCells.clear();
    }

    // -------------------
    // SYMBOLS
    // -------------------

    getSymbolPosition(coords) {
        const symbol = this._getSymbol(coords);
        if (symbol) {
            const matrix = symbol.view.getWorldTransformMatrix();
            return { x: matrix.tx, y: matrix.ty };
        }

        const { symbolSize } = this._getLayout();
        const matrix = this.getCell(coords).container.getWorldTransformMatrix();
        const { scaleX, scaleY } = matrix.decomposeMatrix();
        return {
            x: matrix.tx + symbolSize / 2 * scaleX,
            y: matrix.ty + symbolSize / 2 * scaleY,
        };
    }

    getSymbolsInView(id) {
        const result = [];
        this.forEachCell(cell => {
            if (cell.getId() !== id || !cell.getSymbol()) return;
            result.push({ reel: cell.reel, row: cell.row, symbol: cell.getSymbol(), ...this.getSymbolPosition(cell) });
        });
        return result;
    }

    async spawnSymbol({ reel, row, id, value = null }) {
        await this.getCell({ reel, row })?.changeSymbol({ id, value });
    }

    clearCell(coords) {
        this.getCell(coords)?.setSymbol({ id: BLANK_ID });
    }

    setStrip(strip, values = null) {
        values = this._normalizeValues(values);
        this.forEachCell(cell => {
            cell.setSymbol({
                id: strip?.[cell.reel]?.[cell.row] ?? BLANK_ID,
                value: values?.[cell.reel]?.[cell.row] ?? null,
            });
        });
    }

    resetCells() {
        this._fixedCells.clear();
        this.forEachCell(cell => cell.clearSymbols());
    }

    entriesToMatrix(entries = [], field = 'symbol') {
        const fill = field === 'symbol' ? BLANK_ID : null;
        const matrix = this.model.getGrid().map(rows => Array(rows).fill(fill));

        entries.forEach(entry => {
            if (matrix[entry.reel]) matrix[entry.reel][entry.row ?? entry.position] = entry[field];
        });

        return matrix;
    }

    _normalizeValues(values) {
        if (!Array.isArray(values) || values.length === 0) return values;
        const isEntriesList = !Array.isArray(values[0]);
        return isEntriesList ? this.entriesToMatrix(values, 'value') : values;
    }

    // -------------------
    // CREATE
    // -------------------

    _createCells(strip, values) {
        const layout = this._getLayout();
        const reelsConfig = this._getResponsiveConfig();

        this.model.getGrid().forEach((rows, reel) => {
            const reelCells = [];

            for (let row = 0; row < rows; row++) {
                const cell = new CellView({
                    scene: this.scene,
                    model: this.model,
                    reel,
                    row,
                    rowSpacing: layout.rowSpacing,
                    reelsConfig,
                    id: strip?.[reel]?.[row] ?? BLANK_ID,
                    value: values?.[reel]?.[row] ?? null,
                    ...this.cellOptions,
                });

                cell.setPosition(layout.reels[reel].x, layout.reels[reel].y + row * layout.rowSpacing);
                this.cellsContainer.add(cell.getContainer());
                reelCells.push(cell);
            }

            this.cells.push(reelCells);
        });
    }

    _drawMask() {
        const debugAlpha = this.model.getDebugMode() ? .1 : 0;
        const { symbolSize } = this._getLayout();
        const { x: padX, y: padY } = this.maskPadding;

        this.forEachCell(cell => {
            const { translateX, translateY, scaleX, scaleY } = cell.container.getWorldTransformMatrix().decomposeMatrix();

            cell.setMaskRect({
                x: translateX - padX * scaleX,
                y: translateY - padY * scaleY,
                width: (symbolSize + padX * 2) * scaleX,
                height: (symbolSize + padY * 2) * scaleY,
            }, debugAlpha);
        });
    }

    refreshMask() {
        this._drawMask();
    }

    // -------------------
    // SPIN
    // -------------------

    addNewSymbols(strip, values = null) {
        values = this._normalizeValues(values);

        this.forEachCell(cell => {
            if (cell.locked) return;
            cell.addNewSymbol({
                id: strip?.[cell.reel]?.[cell.row] ?? BLANK_ID,
                value: values?.[cell.reel]?.[cell.row] ?? null,
            });
        });
    }

    async animateSpin(delayBetweenCells = 50, speedMultiplier = 1) {
        let order = 0;
        const spins = [];

        this.forEachCell(cell => {
            if (!cell.hasPendingSpin) return;
            spins.push(cell.animateSpin({ delay: order++ * delayBetweenCells, speedMultiplier }));
        });

        await Promise.all(spins);
    }

    async spinCell({ reel, row, position, id = BLANK_ID, value = null, delay = 0, speedMultiplier = 1 }) {
        const cell = this.getCell({ reel, row, position });
        if (!cell) {
            console.warn(`Cell ${reel}:${row ?? position} does not exist`);
            return;
        }

        cell.addNewSymbol({ id, value });
        await cell.animateSpin({ delay, speedMultiplier });
    }

    async spinCells(cells, delayBetweenCells = 50, speedMultiplier = 1) {
        await Promise.all(cells.map((cell, i) => this.spinCell({
            ...cell,
            delay: i * delayBetweenCells,
            speedMultiplier,
        })));
    }

    stopSpin() {
        this.forEachCell(cell => cell.stopSpin());
    }

    stopCell(coords) {
        this.getCell(coords)?.stopSpin();
    }

    // -------------------
    // SHOW / HIDE
    // -------------------

    animHideCells(duration = 400) {
        return this._tweenAlpha(1, 0, duration);
    }

    animShowCells(duration = 400) {
        return this._tweenAlpha(0, 1, duration);
    }

    _tweenAlpha(from, to, duration) {
        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: this.cellsContainer,
                alpha: { from, to },
                duration,
                onComplete: resolve,
            });
        });
    }

    // -------------------
    // WIN ANIMATIONS (wonPrizes = [{ symbols: [{ reel, row | position }] }])
    // -------------------

    _getWinningSymbols(wonPrizes) {
        return wonPrizes
            .flatMap(group => group.symbols ?? group)
            .map(p => this._getSymbol(p))
            .filter(Boolean);
    }

    showAllBorders(wonPrizes) {
        this._getWinningSymbols(wonPrizes).forEach(symbol => symbol.showBorder());
    }

    dimNonWinning(wonPrizes) {
        const winning = new Set(this._getWinningSymbols(wonPrizes));
        this.forEachCell(cell => {
            const symbol = cell.getSymbol();
            if (symbol && !winning.has(symbol)) symbol.dim();
        });
    }

    playWinningSymbolAnims(wonPrizes = []) {
        new Set(this._getWinningSymbols(wonPrizes)).forEach(symbol => symbol.playWinAnim());
    }

    async playWaysAnimation({ wonPrizes, effects = [], duration, delayBetweenWays = 0 }) {
        if (effects.length === 0) return;

        this.isPlayingWin = true;
        this.scene.sound.play('won', { volume: 0.1 });

        const delay = (ms) => new Promise(resolve => {
            this._activeTimeout = setTimeout(resolve, ms);
        });

        while (this.isPlayingWin) {
            for (const group of wonPrizes) {
                if (!this.isPlayingWin) return;

                const symbols = (group.symbols ?? group).map(p => this._getSymbol(p)).filter(Boolean);
                await Promise.all(effects.map(effect => effect(symbols, duration, delay)));
                await delay(delayBetweenWays);
            }
        }
    }

    async resetWinAnimations() {
        this.isPlayingWin = false;
        clearTimeout(this._activeTimeout);
        this._activeTimeout = null;

        const promises = [];
        this.forEachCell(cell => {
            const symbol = cell.getSymbol();
            if (symbol) promises.push(symbol.resetVisual());
        });

        await Promise.all(promises);
    }

    destroy() {
        this.forEachCell(cell => cell.destroy());
        this.cells = [];
        this._fixedCells.clear();
        this.cellsContainer.destroy();
    }
}
