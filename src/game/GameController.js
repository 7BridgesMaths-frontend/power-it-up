import config from "@config";
import { Model, SpinResult, ResponsiveManager } from "../core";
import { borderEffect, EFFECTS_MAP, ReelsController } from "../features/reels";
import { UIControlsBar, UIView } from "../ui";
import GameState from "./GameState";
import { SLOT_TYPES } from "../constants/slotTypes";
import { MYSTERY_ID } from "../constants/IDs";
import { DebugPanel, DevTool, StatsPanel } from "../utils";
import SessionManager from "../services/SessionManager";
import DraggableHelper from "../utils/DraggableHelper";
import { CascadeController } from "../features/cascade";
import { CellsController } from "../features/cells";
import AudioManager from "../audio/AudioManager";

// Spin types that consume an autoplay round. The API may name the base spin either way
const BASE_SPIN_TYPES = ["basespin", "basegame"];

export default class GameController extends Phaser.Scene {
    constructor(){
        super("GameController")
    }

    async create(data){
        if (!data?.fontsReady) {
            await document.fonts.ready;
            await document.fonts.load('16px Inter');
            await document.fonts.load('bold 16px Inter');
            if (document.fontLoading) {
                await document.fontLoading;
            }
        }

        this.responsive = new ResponsiveManager(this);
        ResponsiveManager.setForScene(this, this.responsive);

        this._createDraggableHelper()
        this._createModel()
        this._createUI()
        this._createStatsPanel()
        this._createSessionManager()
        this._createControllers()
        this._createDevTools()
        this._createAudioManager()
    }

    _createDraggableHelper() {
        this.draggableHelper = new DraggableHelper(this);

        if (config.debug) {
            this.input.keyboard.on('keydown-D', () => {
                this.draggableHelper.toggle();
            });
            window.testLine = (...lineIds) => this.reelsController?.previewLines(lineIds);
            window.testWinBox = (lineId = 1, count = 5) => this.reelsController?.previewWinBoxes(lineId, count);
        }

        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                }
                event.preventDefault();
                const stopContainer = this.controls_bar?.spinButton?.getStopContainer();
                if (stopContainer?.visible) {
                    this.controls_bar?._onStopClick();
                } else if (!this.controls_bar?.isSpinning) {
                    if (this.controls_bar?.spinButton?.spinButtonIsLocked) return;
                    this.controls_bar?._onSpinClick();
                }
            }
        });
    }
    
    _createSessionManager(){
        this.sessionManager = new SessionManager();
    
        this.sessionManager.startInactivityTimer(
            () => {
                this.ui.showTimeoutScreen()
            },
            10,
            (minutes, seconds) => {
                this.statsPanel.updateSessionTimer(minutes, seconds);
            }
        );
    }
    // -------------------
    // CREATE ELEMENTS
    // -------------------
    _createStatsPanel(){
        this.statsPanel = new StatsPanel(this, false, this.responsive.isMobileView(), this.model.getPayTable());
    }

    _createDevTools(){
        if (!this.model.getDebugMode()) return

        this.devTool = new DevTool({scene: this})
        this.devTool.register([
            ...this.reelsController.getContainersToShowBorder(),
            ...this.ui.getContainersToShowBorder(),
        ])
        this.devTool.executeFunction(async ()=>{
            
        })
    }

    _createAudioManager(){
        this.audioManager = new AudioManager(this);
        this.audioManager.playBackgroundMusic('gameBGM')
    }

    _createModel(){
        const gameConfig = config
        const gameName = gameConfig.gameName.toLowerCase().trim().split(/\s+/).map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ');
        document.title = `${gameName} | Slot Demo Tool`

        const emoji = config.emojiFavicon || "";

        document.head.innerHTML += `
        <link rel="icon" href="data:image/svg+xml,
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
            <text y='0.9em' font-size='90'>${emoji}</text>
        </svg>">
        `;
        
        this.model = new Model(this, gameConfig, this.game.api)
        this.setGameInfo()
        this.state = new GameState({model: this.model})
    }

    setGameInfo(){
        if (!this.game.api?.session) return

        const gameInfo = this.game.api.session

        this.model.setConfig({
            bet: gameInfo.bet,
            lines: gameInfo.lines,
            paytable: gameInfo.paytable,
            version: gameInfo.version,
            spinTypes: gameInfo.spinTypes,
            side_bet_costs: gameInfo.side_bet_costs,
            symbols: gameInfo.symbols,
            bonus_buy_cost: gameInfo.bonus_buy_cost
        })
    }

    _createUI(){
        this.ui = new UIView({scene: this, model: this.model})
        this.ui.updateVersion(this.model.getVersion())

        this._createUIControls()
        
        // this.bgm = this.sound.add('gameBGM', {
        //     volume: 0.1, 
        //     loop: true 
        // });
        // this.bgm.play();
    }
    
    _createUIControls(){
        this.controls_bar = new UIControlsBar({scene: this, model: this.model})
        
        this.controls_bar.on('startSpin', ()=>{
            if (this._resolveSpinClick) {
                const resolve = this._resolveSpinClick
                this._resolveSpinClick = null
                this.controls_bar.disableControls()
                resolve()
                return
            }
            this.startSpin({isBonusBuy: false, type: this.state.getGameType()})
        })
        
        this.controls_bar.on('setGameType', (value)=>{
            this.state.setGameType(value)
        })

        this.controls_bar.on('stopSpin', ()=>{
            this.stopSpin()
        })

        this.controls_bar.on('setSideBet', (isSideBet, sideBet)=>{
            const currentSideBet = isSideBet ? sideBet : null
            // A side bet is itself a spin type, so forced plays can't be combined with it
            if (isSideBet){
                this.controls_bar.resetForcedPlay()
                this.controls_bar.disableForcedPlay()
                this.state.setGameType(this.model.getSpinOptions()[0]?.spinType ?? "basegame")
            } else {
                this.controls_bar.enableForcedPlay()
            }

            const multiplier = currentSideBet ? currentSideBet.multiplier : 1
            this.state.setSideBet(isSideBet, currentSideBet)
            this.controls_bar.betSelector.setSideBetMultiplier(multiplier)
            this.state.setTotalBet(this.state.getBaseBet())
        })

        this.controls_bar.on('autoPlay', (rounds)=>{
            this.controls_bar.updateRoundsLeft(rounds)
            this.state.setAutoPlay(true)
            this.state.setAutoPlayRounds(rounds)
            this.startSpin({isBonusBuy: false, type: this.state.getGameType()})
        })

        this.controls_bar.on('stopAutoPlay', () => {
            this.state.setAutoPlay(false)
            this.state.setAutoPlayRounds(0)
        })

        this.controls_bar.on('updateTotalBet', (value)=>{
            this.state.setTotalBet(value)
        })
        this.controls_bar.on('setTurbo', (isTurbo) => {
            const gameSpeed = isTurbo ? 2 : 1
            this.tweens.timeScale = gameSpeed;
            // this.state.setTurbo(isTurbo);
        });

        this.controls_bar.on('bonusBuy', (bonusBuyInfo)=>{
            if (this.state.sideBet) {
                this.state.setSideBet(false);
                this.controls_bar.betSelector.setSideBetMultiplier(1);
                this.controls_bar.sideBetButton.setActive(false);
            }
            this.state.setBonusBuy(bonusBuyInfo)
            this.startSpin({isBonusBuy: true, type: this.state.bonusBuy.type})
        })
    }

    _createControllers() {
        this._createReels()
        // this._createCascade()
        this._createCells()
    }

    _createCells(){
        this.cellsController = new CellsController({
            scene: this,
            model: this.model,
        })
    }

    _createCascade(){
        this.cascadeController = new CascadeController({
            scene: this,
            model: this.model
        })
    }

    _createReels(){
        this.reelsController = new ReelsController({
            scene: this,
            model: this.model
        })
    }
    
    // -------------------
    // SPIN
    // -------------------

    async startSpin({isBonusBuy = true, type}){
        if (!this.chargeBalance(isBonusBuy)) {
            alert("You don't have enough balance.")
            this.controls_bar.enableControls();
            return;
        }
    
        this._prepareUI();
        this.reelsController.resetReels()

        const spinType = isBonusBuy ? 'basegame' : type
        
        const newPlay = await this.model.getSpin({
            type: spinType, 
            sidebet: this.state.isSideBet() ? { id: this.state.getSideBetId() } : null,
            bonusBuy: isBonusBuy ? type : null
        });

        if (!newPlay){
            alert("No plays were found.")
            this.state.refundBalance();
            this.controls_bar.updateBalance(this.state.getBalance());
            this.controls_bar.enableControls()
            return
        }
        const meta = this.model.getPlayMeta()
        
        this.sessionManager.resetInactivityTimer()
        this.statsPanel.setMeta(meta.file, meta.playNumber)
        this.statsPanel.registerSpin(this.state.lastChargedAmount)
        
        await this.spinResponse(newPlay)
    }

    async spinResponse(result) {
        try {
            this._updateAutoPlay(result);
            await this._prepareForSpin(result);
            await this._animateReels();
            await this._resolveResult();
        } catch (error) {
            console.error('Spin error:', error);
            this.controls_bar.enableControls();
        }
    }
    
    stopSpin(){
        this.reelsController.stopSpin()
        this.cellsController?.stopSpin()
    }

    // -------------------
    // AUTOPLAY
    // -------------------

    _prepareUI(){
        this.state.setTotalWin(0);
        this.controls_bar.updateTotalWin(this.state.getTotalWin());
        this.controls_bar.disableControls();
    }

    // Checks the incoming result: this.lastResult still holds the previous spin at this point
    _updateAutoPlay(result){
        if (this.state.isAutoPlay() && BASE_SPIN_TYPES.includes(result.type)){
            this.state.consumeAutoPlayRound()
            this.controls_bar.updateRoundsLeft(this.state.getRoundsLeft())
        }
    }

    async _prepareForSpin(result) {
        await this.resetWinAnimations();
        this.controls_bar.enableStopButton();

        this.state.resetValues();
        this.lastResult = new SpinResult(result);
        this.previousResultType = this.lastResult.spinType;

        this.state.addFreeSpins(this.lastResult.freeGames);

        if (this.state.isBonusActive()) {
            this.updateFSLeft(this.lastResult.remainingFreeGames);
        }

        this.reelsController.addNewSymbols(this.lastResult.reelsSlices);
    }

    async _animateReels() {
        const speedMultiplier = this.state.getTurbo() ? 5 : 1;
        await this.reelsController.animateSpin(this.lastResult.reelsSlices, 100, speedMultiplier);
        await this.applyModifiers();
        this.controls_bar.disableStopButton();
    }

    async applyModifiers(){
        /** 
         * ACÁ VAN TODAS LAS FUNCIONES DE CADA MODIFICADOR
        */
    }

    async _resolveResult() {
        await this.playWinAnimations();
        await this.handleSpinEnd();
    }

    updateFSLeft(remainingFreeGames){
        this.state.setRemainingFreeSpins(remainingFreeGames)
        this.ui.updateFSLeft(remainingFreeGames);
    }
    
    async spinFinished() {
        this.statsPanel.registerWin(this.state.totalWin, this.state.getBet())
        
        const shouldContinue = this.state.isAutoPlay();

        if (this.state.isBonusActive()) {
            await this.endFreeGames(this.state.getTotalWin());
        }

        if (shouldContinue) {
            this.startSpin({
                isBonusBuy: false,
                type: this.state.getGameType()
            });
        } else {
            this.controls_bar.hideStopAutoPlay()
            this.state.setAutoPlay(false);
            this.controls_bar.enableControls();
        }
    }

    _restartControls(){
        this.controls_bar.enableControls()
    }

    async handleSpinEnd() {
        const totalWin = this.lastResult.wonCredits
    
        await this._handleSpinWin(totalWin)

        if (this.state.hasFreeSpins()){
            await this._handleFreeGames(this.lastResult.freeGames);
        }

        const response = this.model.spinNextStep();

        if (!response){
            this.controls_bar.updateBalance(this.state.getBalance());
            this.spinFinished()
            return
        }

        if (this.model.getSpinTrigger(response.type) === 'click') {
            await this._waitForSpinClick()
        }

        this.spinResponse(response)
    }

    // Resolved by the 'startSpin' listener instead of starting a new round
    _waitForSpinClick(){
        return new Promise(resolve => {
            this._resolveSpinClick = resolve
            this.controls_bar.enableSpinOnly()
        })
    }

    async _handleSpinWin(win) {
        this.state.addWin(win);

        const spinWin = this.state.getSpinWin();
        const isBigWin = this.state.isBigWin();

        if (win > 0) {
            if (isBigWin) {
                await this.ui.showBigWin(spinWin, isBigWin.type)
                await this.turboDelay(1000);
                await this.ui.closeBigWin();
            } else {
                await this.ui.showSpinWin(spinWin);
                await this.turboDelay(1000);
                await this.ui.closeSpinWin();
            }
        }

        this.controls_bar.updateBalance(this.state.getBalance());
        this.controls_bar.updateTotalWin(this.state.getTotalWin());

        if (win > 0) await this.turboDelay(500);
    }

    async _handleFreeGames(freeGamesNumber){
        if (this.previousResultType != "basespin") return
        this.state.setBonus(true);

        await this.ui.showWonFreeGamesSign(freeGamesNumber);
        this.ui.updateFSLeft(freeGamesNumber)
        this.ui.showFreeGamesScene()
        await this.turboDelay(1000)
        await this.ui.closeWonFreeGamesSign()
    }

    async endFreeGames(win){
        this.state.setBonus(false)

        if (win > 0){
            await this.ui.showTotalWin(win)
            await this.turboDelay(700)
            this.ui.showBaseScene()
            await this.ui.closeTotalWin()
        } else {
            await this.ui.showNoWinSign()
            await this.turboDelay(700)
            this.ui.showBaseScene()
            await this.ui.closeNoWinSign()
        }
    }
    
    async _handleWaysAnimation({ border, effects = [], duration, delayBetweenWays }) {
        const wonPrizes = this.lastResult.wonPrizes
        if (wonPrizes.length == 0) return

        this.reelsController.dimNonWinning(wonPrizes);
        this.reelsController.playWinningSymbolAnims(wonPrizes);

        if (border?.visible && !border.groupBySymbol) {
            this.reelsController.showAllBorders(wonPrizes);
        }

        let resolvedEffects = effects
            .map(name => {
                const effect = EFFECTS_MAP[name];

                if (!effect) {
                    console.warn(`Effect "${name}" no existe`);
                    return null;
                }

                return effect;
            }).filter(Boolean)

        if (border?.visible && border.groupBySymbol) {
            resolvedEffects.push(borderEffect);
        }

        await this.reelsController.playWaysAnimation({
            wonPrizes,
            effects: resolvedEffects,
            duration,
            delayBetweenWays
        });
    }

    async _handleLinesAnimation({ effects = [], duration, delayBetweenLines, allLinesDuration, winBoxes }) {
        const wonPrizes = this.lastResult.wonPrizes;
        if (wonPrizes.length == 0) return;

        this.reelsController.dimNonWinning(wonPrizes);
        this.reelsController.playWinningSymbolAnims(wonPrizes);

        const resolvedEffects = effects
            .map(name => {
                const effect = EFFECTS_MAP[name];
                if (!effect) {
                    console.warn(`Effect "${name}" no existe`);
                    return null;
                }
                return effect;
            }).filter(Boolean);


        await this.reelsController.playLinesAnimation({
            wonPrizes,
            effects: resolvedEffects,
            duration,
            delayBetweenLines,
            allLinesDuration,
            winBoxes
        });
    }

    async playWinAnimations(){
        await this.turboDelay(500)

        const slotType = this.model.getSlotType()
        
        if (slotType == SLOT_TYPES.WAYS){
            this._handleWaysAnimation(this.model.getWaysWinningAnimation())
        }

        if (slotType == SLOT_TYPES.LINES){
            this._handleLinesAnimation(this.model.getLinesWinningAnimation())
        }
    }

    chargeBalance(isBonusBuy) {
        let success;

        if (isBonusBuy) {
            success = this.state.chargeBonus(this.state.bonusBuy);
        } else {
            success = this.state.chargeBet();
        }

        if (success) {
            this.controls_bar.updateBalance(this.state.getBalance());
        }

        return success;
    }
    
    delay(ms) {
        return new Promise(resolve => {
            this.time.delayedCall(ms, resolve, null, this);
        });
    }
    turboDelay(ms) {
        return this.delay(ms / (this.state.getTurbo() ? 5 : 1));
    }
    async resetWinAnimations() {
        await this.reelsController.resetWinAnimations();
        await this.cascadeController?.resetWinAnimations?.()
        await this.cellsController?.resetWinAnimations?.()
        await this.delay(100)
    }
}