import { Model, ResponsiveManager } from "../../core"
import { DebugPanel } from "../../utils";
import { drawBounds } from "../../utils/drawBounds";
import { generateLineColors } from "../../utils/generateLinesColors";
import { SymbolView } from "../symbols";
import ReelView from "./ReelView"
import { getCellCenter, getMaskRects, getSymbolCellBounds, resolveReelsLayout } from "./reelsLayout";
import { drawWinLine, getWinLinePoints } from "./effects/winLines";
import { createWinBox } from "./effects/winBoxes";
import { isBackgroundMasked, layoutBackground, layoutFrame } from "./reelsAttach";

export default class ReelsController {
    constructor({ scene, model }) {
        /** @type {Phaser.Scene} */
        this.scene = scene
        /** @type {Model} */
        this.model = model

        this.isPlayingWin = false;

        this._createBackground()

        this.reelsContainer = this.scene.add.container(0, 0).applyResponsive('reels');

        /** @type {ReelView[]} */
        this.reels = []

        this._createReels()

        this._createStickiesContainer()

        this._createLinesContainer()

        this._drawMask()
    }

    _getResponsiveConfig() {
        return ResponsiveManager.getForScene(this.scene)?.get('reels') || {};
    }

    _getLayout() {
        return resolveReelsLayout(this.model, this._getResponsiveConfig());
    }

    getContainersToShowBorder() {
        const result = [this.reelsContainer];

        this.reels.forEach(reel => {
            result.push(reel.container);
        });

        return result;
    }

    _getSymbol({ position, reel }) {
        return this.reels[reel].symbols[position];
    }

    _drawMask(){
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
        this.stickiesContainer.setPosition(config.x, config.y).setScale(scaleX, scaleY);
        this.winBoxesContainer.setPosition(config.x, config.y).setScale(scaleX, scaleY);

        const layout = this._getLayout();
        this.reels.forEach((reelView, i) => {
            reelView.setPosition(layout.reels[i].x, layout.reels[i].y);
            reelView.symbols.forEach(symbol => symbol.refreshScale());
            reelView._repositionSymbols();
        });

        this._fillMask();
    }

    _createReels() {
        const layout = this._getLayout();

        if (isBackgroundMasked(this.scene)) this.reelsContainer.add(this.reelsBG);
        this._layoutBackground();

        for (let i = 0; i < this.model.getGrid().length; i++) {
            const reelView = this._createReelView(i)
            const { x, y } = layout.reels[i];
            reelView.setPosition(x, y);
            const reelViewContainer = reelView.getContainer()
            this.reelsContainer.add(reelViewContainer)

            this.reels.push(reelView)
        }

        this.reelsFrame = this.scene.add.sprite(0, 0, 'reelsFrame')
            .setOrigin(0)
            .setDepth(1)
        this._layoutFrame();
    }

    _createReelView(index) {
        const reelHeight = this.model.getGrid()[index]
        const strip = this.model.getReelById(index)

        const reelView = new ReelView({
            scene: this.scene,
            initialHeight: reelHeight,
            model: this.model,
            index,
            strip,
            spinCount: 3+index
        });
        

        return reelView
    }

    _createLinesContainer(){
        this.linesContainer = this.scene.add.container(0, 0).setDepth(1)
        this.winBoxesContainer = this.scene.add.container(0, 0).applyResponsive('reels').setDepth(1)
    }

    _createStickiesContainer(){
        const {x, y, scaleX, scaleY} = this.reelsContainer

        this.stickiesContainer = this.scene.add.container(x, y).setScale(scaleX, scaleY)

        /** @type {(SymbolView | null)[][]} */
        this.stickies = [];
        this.stickies = this.model.getGrid().map(rows =>
            Array(rows).fill(null)
        );
    }

    stopSpin(){
        this.reels.forEach(reelView => reelView.stopSpin());
    }

    addNewSymbols(strip){
        for (let i = 0; i < this.reels.length; i++) {
            let reelView = this.reels[i];
            reelView.addNewSymbols({
                strip: strip[i],
            });
        }
    }

    /**
     * 
     * @param {[][]} strip 
     * @param {number} delayBetweenReels Unidad: ms
     */
    async animateSpin(strip, delayBetweenReels = 50, speedMultiplier = 1){
        const animationPromises = this.reels.map(async (reelView, i) => {
            const reelStrip = strip[i];
            if (!reelStrip) return; 
            const response = reelView.animateSpin({
                delay: i * delayBetweenReels,
                steps: strip[i].length * reelView.spinCount,
                speedMultiplier
            });
            await response
            reelView.clearExtraSymbols(strip[i].length)
            reelView.playLandAnims()
            return response
        });

        await Promise.all(animationPromises);
    }

    async playLinesAnimation({ wonPrizes = [], effects = [], duration = 600, delayBetweenLines = 500, allLinesDuration = 0, winBoxes = false }) {
        this.isPlayingWin = true;
        const lineColors = generateLineColors(wonPrizes.length);

        this.scene.sound.play('won', { volume: 0.1 });

        const delay = (ms) => new Promise(res => {
            this._activeTimeout = setTimeout(res, ms);
        });

        if (allLinesDuration > 0) {
            const allLines = wonPrizes.map((group, index) => this._showWinLine(group, lineColors[index]));
            if (winBoxes) this.showWinBoxes(wonPrizes);
            await delay(allLinesDuration);
            allLines.forEach(line => line.destroy());
            this.clearWinBoxes();
            if (!this.isPlayingWin) return;
        }

        while (this.isPlayingWin) {
            for (let [index, group] of wonPrizes.entries()) {
                if (!this.isPlayingWin) return;

                const symbols = group.symbols.map(p => this._getSymbol(p));

                const line = this._showWinLine(group, lineColors[index]);
                if (winBoxes) this.showWinBoxes([group]);

                if (effects.length > 0) {
                    await Promise.all(
                        effects.map(effect => effect(symbols, duration, delay))
                    );
                } else {
                    await delay(duration); // <- espera aunque no haya effects
                }

                line.destroy();
                this.clearWinBoxes();
                await delay(delayBetweenLines);
            }
        }
    }

    _showWinLine(prize, color) {
        const line = prize.lineId != null ? this.model.getLine(prize.lineId) : null;
        const cellWidth = this._getLayout().symbolSize * this.reelsContainer.scaleX;

        const points = line
            ? getWinLinePoints(line.positions, (reel, position) => this._getCellWorldCenter({ reel, position }), cellWidth)
            : prize.symbols.slice().sort((a, b) => a.reel - b.reel).map(p => this._getCellWorldCenter(p));

        return drawWinLine(this.scene, this.linesContainer, points, color, { scale: this.reelsContainer.scaleX });
    }

    _getCellWorldCenter({ reel, position }) {
        const { x, y } = getCellCenter(this._getLayout(), reel, position);
        const { x: containerX, y: containerY, scaleX, scaleY } = this.reelsContainer;
        return { x: containerX + x * scaleX, y: containerY + y * scaleY };
    }

    showWinBoxes(prizes) {
        const layout = this._getLayout();
        this.winBoxCells ??= new Set();

        prizes.flatMap(prize => prize.symbols).forEach(({ reel, position }) => {
            const key = `${reel}-${position}`;
            if (this.winBoxCells.has(key)) return;
            this.winBoxCells.add(key);
            this.winBoxesContainer.add(createWinBox(this.scene, getCellCenter(layout, reel, position), layout.symbolSize));
        });
    }

    clearWinBoxes() {
        this.winBoxCells?.clear();
        this.winBoxesContainer.removeAll(true);
    }

    previewLines(lineIds) {
        this.clearLines();
        const colors = generateLineColors(lineIds.length);

        return lineIds.map((lineId, index) => {
            const line = this.model.getLine(lineId);
            if (!line) {
                console.warn(`Line ${lineId} not found. Lines from the session:`, this.model.lines);
                return null;
            }

            this._showWinLine({ lineId, symbols: [] }, colors[index]);
            return line.positions;
        });
    }

    previewWinBoxes(lineId, count = 5) {
        this.clearLines();

        const line = this.model.getLine(lineId);
        if (!line) {
            console.warn(`Line ${lineId} not found. Lines from the session:`, this.model.lines);
            return null;
        }

        const symbols = line.positions.slice(0, count).map((position, reel) => ({ reel, position }));
        this._showWinLine({ lineId, symbols }, generateLineColors(1)[0]);
        this.showWinBoxes([{ symbols }]);
        return symbols;
    }

    async playWaysAnimation({ wonPrizes, effects = [], duration, delayBetweenWays = 0}) {
        this.isPlayingWin = true;

        if (effects.length == 0) return

        this.scene.sound.play('won', { volume: 0.1 });


        const delay = (ms) => new Promise(res => {
            this._activeTimeout = setTimeout(res, ms);
        });
        
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

    addStickies({stickiesIDs = [], stickiesValues = []}){
        const symbolsID = new Set(stickiesIDs)

        const tempPoint = new Phaser.Math.Vector2();
        for (let reel = 0; reel < this.reels.length; reel++) {
            const reelView = this.reels[reel];
            for (let row = 0; row < reelView.symbols.length; row++) {
                const symbolView = reelView.symbols[row]
                const id = symbolView.getId()
                if (symbolsID.has(id) && !this.stickies[reel][row]){
                    const x = reelView.container.x
                    const y = reelView.container.y + symbolView.getPosition().y

                    const sticky = new SymbolView({scene: this.scene, model: this.model, index: row, id,})

                    sticky.setPosition(x, y)
                    this.stickiesContainer.add([sticky.container])
                    this.stickies[reel][row] = sticky;
                }
            }
        }
    }

    async resetWinAnimations(){
        this.isPlayingWin = false;
        clearTimeout(this._activeTimeout);
        this._activeTimeout = null;

        this.clearLines()

        const promises = this.reels.flatMap(reel => {
            reel.clearTweens();
            return reel.symbols.map(sym => sym.resetVisual());
        });

        await Promise.all(promises);
    }

    showAllBorders(wonPrizes) {
        const symbols = wonPrizes
            .flatMap(prize => prize.symbols)
            .map(p => this._getSymbol(p));
        
        symbols.forEach(s => s.showBorder());
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
                if (!winning.has(sym)) {
                    sym.dim();
                }
            });
        });
    }

    playWinningSymbolAnims(wonPrizes = []) {
        const winning = new Set();

        wonPrizes.forEach(group => {
            const positions = group.symbols ?? group;
            positions.forEach(p => {
                const sym = this._getSymbol(p);
                if (sym) winning.add(sym);
            });
        });

        winning.forEach(sym => sym.playWinAnim());
    }

    async pulseWinningSymbols(wonPrizes) {
        this.isPlayingWin = true;

        while (this.isPlayingWin) {
            for (let group of wonPrizes) {

                const symbols = group.symbols.map(p => this._getSymbol(p));

                await Promise.all(symbols.map(sym => sym.playPulse()));

                await this._delay(500);
            }
        }
    }

    async borderWinningSymbols(wonPrizes, showAll = false) {
        this.isPlayingWin = true;

        if (showAll) {
            this._showAllBorders(wonPrizes);
        } else {
            this.playWaysBorderLoop(wonPrizes);
        }
    }

    _showAllBorders(wonPrizes) {
        const winning = new Set();

        wonPrizes.forEach(group => {
            group.forEach(p => {
                const sym = this._getSymbol(p);
                winning.add(sym);
            });
        });

        winning.forEach(sym => sym.showBorder());
    }

    async playWaysBorderLoop(wonPrizes){
        while (this.isPlayingWin) {
            for (let group of wonPrizes) {
                const symbols = group.map(p => this._getSymbol(p));

                // prender bordes
                symbols.forEach(sym => sym.showBorder());

                await this._delay(1100);

                // apagar bordes
                symbols.forEach(sym => sym.stopBorder());
            }
        }
    }

    _delay(ms) {
        return new Promise(resolve => {
            this.scene.time.delayedCall(ms, resolve, null, this);
        });
    }
    
    resetReels(){
        this.clearStickies();
    }

    clearLines() {
        this.clearWinBoxes();
        this.linesContainer.removeAll(true)
        this.isPlayingWin = false;
    }

    clearStickies() {
        this.stickiesContainer.removeAll(true);
        this.stickies = this.stickies.map(row => row.map(() => null));
    }

    destroy(){
        // Clear any running tweens
        this.scene.tweens.killTweensOf(this.reelsContainer);

        // Destroy each reel
        this.reels.forEach(reel => reel.destroy());
        this.reels = [];

        // Destroy containers
        this.reelsContainer.destroy();
        this.stickiesContainer.destroy();
        this.linesContainer.destroy();
        this.winBoxesContainer.destroy();
        this.maskShape.destroy();
        this.reelsBG.destroy();
    }
}