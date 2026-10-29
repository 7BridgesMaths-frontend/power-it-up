import { Model, ResponsiveManager } from "../../core";
import { SymbolView } from "../symbols";
import { drawBounds } from "../../utils/drawBounds";
import { SYMBOLS_TO_GROW, SYMBOLS_TO_SHAKE } from "../../constants/IDs";

export default class ReelView extends Phaser.Events.EventEmitter {

    constructor({scene, model, container, index, initialHeight, initialY, strip, spinCount, reelsConfig}) {
        super();

        /** @type { Phaser.Scene } */
        this.scene = scene;
        /** @type { Model } */
        this.model = model;
        this.container = this.scene.add.container(0,0)
        this.index = index;
        this.initialHeight = initialHeight;
        this.actualHeight = initialHeight;
        this.initialY = initialY;
        this.strip = strip;
        this.spinCount = spinCount; 
        this.inBonus = false;
        this.reelsConfig = reelsConfig;
        this.baseY = 0;
        this.createView();
    }

    _getResponsiveConfig() {
        return this.reelsConfig ?? ResponsiveManager.getForScene(this.scene)?.get('reels') ?? {};
    }

    getContainer() {
        return this.container;
    }

    createView() {
        this.createInitialSymbols();
    }

    setPosition(x, y){
        this.baseY = y;
        this.container.setX(x)
        this.container.setY(y)
    }

    getView() {
        return this.container;
    }

    getSymbolsCount(){
        return this.symbolsCount;
    }

    getSymbols(){
        return this.symbols;
    }
    
    createInitialSymbols() {
        /** @type { SymbolView[] } */
        this.symbols = [];        

        for (let i = 0; i < this.initialHeight; i++) {
            const id = this.strip[i];
            const symbolView = this._createSymbol({ id, index: i });
            this.symbols.push(symbolView);
        }
    }

    _createSymbol({ id, index }) {
        const symbolView = new SymbolView({
            scene: this.scene,
            model: this.model,
            id,
            index
        });

        const reelsConfig = this._getResponsiveConfig();
        const symbolSize = reelsConfig.symbolSize ?? this.model.getSymbolSize();
        const gapBetweenSymbols = reelsConfig.gapBetweenRows ?? this.model.getGapBetweenRows();
        const rowSpacing = symbolSize + gapBetweenSymbols;
        const y = index * rowSpacing

        symbolView.setPosition(0, y);

        this.container.add(symbolView.getContainer());

        return symbolView;
    }

    stopSpin() {
        if (this.spinTween) {
            this.spinTween.stop();
            this.spinTween = null;
        }

        if (this._finalY !== null && this._finalY !== undefined) {
            this.container.y = this._finalY;
            this._repositionSymbols();
            this._finalY = null;
        }

        if (this._spinResolve) {
            this._spinResolve();
            this._spinResolve = null;
        }
    }

    async addNewSymbols({ strip }) {
        let nextIndex = -1;

        for (let spin = 0; spin < this.spinCount; spin++) {
            const isLastSpin = spin === this.spinCount - 1;

            for (let j = strip.length - 1; j >= 0; j--) {
                const id = isLastSpin
                    ? strip[j]
                    : Math.floor(Math.random() * 9) + 1;

                const symbol = this._createSymbol({
                    id,
                    index: nextIndex--,
                });

                this.symbols.unshift(symbol);
            }
        }

        this.symbols.forEach((sym, i) => {
            sym.index = i;
        });

        this.actualHeight = strip.length;
    }

    playLandAnims() {
        this.symbols.forEach(sym => sym?.playLandAnim());
    }

    clearExtraSymbols(fixedHeight) {
        if (this.symbols.length>fixedHeight){
            while(this.symbols.length > fixedHeight){
                this.symbols.pop().destroy();
            }
        }  
    }

    async animateSpin({ delay = 0, steps, speedMultiplier = 1 }) {
        const reelsConfig = this._getResponsiveConfig();
        const symbolSize = reelsConfig.symbolSize ?? this.model.getSymbolSize();
        const gapBetweenSymbols = reelsConfig.gapBetweenRows ?? this.model.getGapBetweenRows();
        const rowSpacing = symbolSize + gapBetweenSymbols;

        const spinCount = steps / this.symbols.length;
        const duration = (500 + (spinCount * 400)) / speedMultiplier;

        const lift = 15;
        const overshoot = 20;
        const startY = this.container.y;
        this._finalY = startY + rowSpacing * steps;
        
        return new Promise(resolve => {
            this._spinResolve = resolve;

            this.scene.time.delayedCall(delay + 180 / speedMultiplier + (duration - 80), ()=>{
                // this.scene.audioManager.playStop({volume: 0.1})
            })

            this.spinTween = this.scene.tweens.chain({
                targets: this.container,
                delay: delay,
                tweens: [
                    {
                        y: this.container.y - lift,
                        duration: 180 / speedMultiplier,
                        ease: 'Power2.InOut'
                    },
                    {
                        y: this._finalY + overshoot,
                        duration: duration,
                        ease: 'Sine.InOut'
                    },
                    {
                        y: this._finalY,
                        duration: 120 / speedMultiplier,
                        ease: 'Sine.Out'
                    }
                ],
                onComplete: () => {
                    this._repositionSymbols();
                    this._finalY = null;
                    this._spinResolve = null;
                    resolve();
                }
            });
        });
    }

    _repositionSymbols() {
        const reelsConfig = this._getResponsiveConfig();
        const symbolSize = reelsConfig.symbolSize ?? this.model.getSymbolSize();
        const gapBetweenSymbols = reelsConfig.gapBetweenRows ?? this.model.getGapBetweenRows();
        const rowSpacing = symbolSize + gapBetweenSymbols;

        this.symbols.forEach((sym, i) => {
            sym.setPosition(0, i * rowSpacing);
        });

        this.container.y = this.baseY;
    }

    delay(ms) {
        return new Promise(resolve => {
            this.scene.time.delayedCall(ms, resolve, null, this);
        });
    }

    changeSymbolView(row, new_id){
        this.symbols[row].changeView(new_id);
    }

    clearTweens(){
        if (this.spinTween){
            this.spinTween.stop();
            this.spinTween = null;
        }
    }
    
    clearSymbols(){
        for (let i=0; i< this.symbols.length; i++){
            this.symbols[i].destroy();
        }
    }

    destroy(){
        this.clearTweens();
        this.clearSymbols();
        this.container.destroy();
        this.removeAllListeners();
    }
}
