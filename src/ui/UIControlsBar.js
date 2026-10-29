import { COLORS_LIST } from "../constants/COLORS";
import { Model, ResponsiveManager } from "../core";
import { DebugPanel } from "../utils";
import {
    SpinButton,
    StatsButton,
    TurboButton,
    ControlsGroup,
    ValuesDisplay,
    BetSelector,
    BetButton,
    AutoPlayPanel,
    BonusBuyPanel,
    ForcedPlaySelector,
    SideBetButton
} from "./components";

export default class UIControlsBar extends Phaser.Events.EventEmitter {
    constructor({ scene, model, gameConfig }) {
        super();
        this.scene = scene;
        this.model = model;
        this.mainContainer = this.scene.add.container(0, 0);

        this.isSpinning = false;
        this.isLocked = false;
        this.sideBet = false;

        this._initComponents();
    }

    _getControlsConfig() {
        return ResponsiveManager.getForScene(this.scene)?.get('controls') || {};
    }

    _initComponents() {
        this._createBackground();
        this._createButtons();
    }

    _createBackground() {
        const config = this._getControlsConfig();
        const bg = config.background || {};

        this.ui_background = this.scene.add.rectangle(
            bg.x || 0,
            bg.y || 950,
            bg.width || 1920,
            bg.height || 130,
            0x000000,
            0.5
        );
        this.ui_background.setOrigin(bg.originX || 0, bg.originY || 0);
    }

    _createButtons() {
        const betValues = this.model.getAvailableBets();
        const bonusBuyElements = this.model.getBonusBuyElements();
        const hasInfo = this.model.getInfo();
        const spinOptions = this.model.getSpinOptions();

        const config = this._getControlsConfig();
        this.isMobile = ResponsiveManager.getForScene(this.scene)?.isMobileView();
        const isMobile = this.isMobile;

        this.spinButton = new SpinButton({
            scene: this.scene,
            onSpinClick: () => this._onSpinClick(),
            onStopClick: () => this._onStopClick(),
            config: config.spin || {}
        });

        this.betSelector = new BetSelector({
            scene: this.scene,
            onBetChange: (totalBet) => this.emit('updateTotalBet', totalBet),
            bet: this.model.getBet(),
            availableBets: betValues,
            config: { ...config.betSelector, isMobile }
        });

        this.decreaseBetButton = new BetButton({
            scene: this.scene,
            type: 'decrease',
            onClick: () => this._onDecreaseBet(),
            config: config.decreaseBet || {}
        });

        this.increaseBetButton = new BetButton({
            scene: this.scene,
            type: 'increase',
            onClick: () => this._onIncreaseBet(),
            config: config.increaseBet || {}
        });

        this.turboButton = new TurboButton({
            scene: this.scene,
            onToggle: (isTurbo) => this.emit('setTurbo', isTurbo),
            config: config.turbo || {}
        });

        this.sideBetButton = new SideBetButton({
            scene: this.scene,
            onToggle: (isSideBet, sideBet) => this._onSideBetToggle(isSideBet, sideBet),
            sideBets: this.model.getSideBets(),
            isMobile: this.isMobile
        });

        this.statsButton = new StatsButton({ scene: this.scene, isMobile: this.isMobile });

        this.controlsGroup = new ControlsGroup({
            scene: this.scene,
            hasInfo,
            isMobile: this.isMobile
        });

        this.valuesDisplay = new ValuesDisplay({
            scene: this.scene,
            initialBalance: this.model.getBalance(),
            isMobile: this.isMobile
        });

        this.autoPlayPanel = new AutoPlayPanel({
            scene: this.scene,
            onAutoPlay: (rounds) => this._onAutoPlay(rounds),
            onStopAutoPlay: () => this._onStopAutoPlay(),
            config: { size: this.isMobile ? 'mobile' : 'desktop', hideLabel: this.isMobile }
        });

        this.bonusBuyPanel = new BonusBuyPanel({
            scene: this.scene,
            onBonusBuy: (info) => this._onBonusBuy(info),
            bonusBuyElements,
            isMobile: this.isMobile
        });

        this.forcedPlaySelector = new ForcedPlaySelector({
            scene: this.scene,
            onGameTypeChange: (value) => this.emit('setGameType', value),
            options: spinOptions,
            isMobile: this.isMobile
        });

        const pos = (key) => {
            const cfg = config[key];
            if (!cfg) {
                return { x: 0, y: 0 };
            }
            return { x: cfg.x ?? 0, y: cfg.y ?? 0 };
        };

        const setPos = (key, container) => {
            const p = pos(key);
            if (p) container.setPosition(p.x, p.y);
        };

        this.statsButton.getContainer().setPosition(pos('stats').x, pos('stats').y);

        this.spinButton.getSpinContainer().setPosition(pos('spin').x, pos('spin').y);
        this.spinButton.getStopContainer().setPosition(pos('spin').x, pos('spin').y);

        this.bonusBuyPanel.getContainer().setPosition(pos('bonusBuy').x, pos('bonusBuy').y);

        this.turboButton.getContainer().setPosition(pos('turbo').x, pos('turbo').y);

        this.sideBetButton.getContainer().setPosition(pos('sideBet').x, pos('sideBet').y);

        if (this.controlsGroup) setPos('controls', this.controlsGroup.getContainer());

        this.forcedPlaySelector.getContainer().setPosition(pos('forcedPlay').x, pos('forcedPlay').y);

        this.autoPlayPanel.getContainer().setPosition(pos('autoPlay').x, pos('autoPlay').y);

        this.valuesDisplay.getContainer().setPosition(0, 0);
        this.valuesDisplay.getBalanceContainer().setPosition(pos('balance').x, pos('balance').y);
        this.valuesDisplay.getWinContainer().setPosition(pos('win').x, pos('win').y);

        if (isMobile) {
            setPos('decreaseBet', this.decreaseBetButton.getContainer());
            setPos('betSelector', this.betSelector.getContainer());
            setPos('increaseBet', this.increaseBetButton.getContainer());
        } else {
            this.decreaseBetButton.getContainer().setPosition(0, 65);
            this.betSelector.getContainer().setPosition(70, 65);
            this.increaseBetButton.getContainer().setPosition(215, 65);

            this.controlsContainer = this.scene.add.container(0, 0);
            this.controlsContainer.add([
                this.decreaseBetButton.getContainer(),
                this.betSelector.getContainer(),
                this.increaseBetButton.getContainer()
            ]);
            setPos('controlsContainer', this.controlsContainer);
        }

        const commonElements = [
            this.ui_background,
            this.statsButton.getContainer(),
            this.spinButton.getStopContainer(),
            this.spinButton.getSpinContainer(),
            this.bonusBuyPanel.getContainer(),
            this.turboButton.getContainer(),
            this.sideBetButton.getContainer(),
            this.controlsGroup.getContainer(),
            this.forcedPlaySelector.getContainer(),
            this.autoPlayPanel.getContainer(),
            this.valuesDisplay.getContainer()
        ];

        if (isMobile) {
            commonElements.push(
                this.decreaseBetButton.getContainer(),
                this.betSelector.getContainer(),
                this.increaseBetButton.getContainer(),
                this.betSelector.getPanelContainer()
            );
        } else {
            commonElements.push(this.controlsContainer);
        }

        this.mainContainer.add(commonElements);

        this.mainContainer.setDepth(10);
    }

    showAllControls() {
        this.ui_background.setVisible(true);
        this.statsButton.getContainer().setVisible(true);
        this.spinButton.getStopContainer().setVisible(false);
        this.spinButton.getSpinContainer().setVisible(true);
        this.bonusBuyPanel.getContainer().setVisible(true);
        this.turboButton.getContainer().setVisible(true);
        this.sideBetButton.getContainer().setVisible(true);
        this.controlsGroup.getContainer().setVisible(true);
        this.forcedPlaySelector.getContainer().setVisible(true);
        this.autoPlayPanel.getContainer().setVisible(true);
        this.valuesDisplay.getContainer().setVisible(true);
        this.betSelector.getContainer().setVisible(true);
        this.decreaseBetButton.getContainer().setVisible(true);
        this.increaseBetButton.getContainer().setVisible(true);
    }

    _onSpinClick() {
        this.isSpinning = true;
        this._disableControls();
        this.emit('startSpin');
    }

    _onStopClick() {
        this.emit('stopSpin');
    }

    _onDecreaseBet() {
        const betValues = this.model.getAvailableBets();
        const baseBet = this.betSelector?.baseBet ?? this.model.getBet();
        const index = betValues.findIndex(bet => bet.value === baseBet);
        if (index > 0) {
            const value = betValues[index - 1].value;
            this.betSelector.setTotalBet(value / 100);
        }
    }

    _onIncreaseBet() {
        const betValues = this.model.getAvailableBets();
        const baseBet = this.betSelector?.baseBet ?? this.model.getBet();
        const index = betValues.findIndex(bet => bet.value === baseBet);
        if (index < betValues.length - 1) {
            const value = betValues[index + 1].value;
            this.betSelector.setTotalBet(value / 100);
        }
    }

    _onSideBetToggle(isSideBet, sideBet = null) {
        this.sideBet = isSideBet;
        this.currentSideBet = sideBet;
        this.emit('setSideBet', isSideBet, sideBet);
    }

    _onAutoPlay(rounds) {
        this.isSpinning = true;
        if (this.autoPlayPanel) {
            this.autoPlayPanel.disable();
        }
        this.emit('autoPlay', rounds);
    }

    _onStopAutoPlay() {
        if (this.autoPlayPanel) {
            this.autoPlayPanel.enable();
        }
        this.emit('stopAutoPlay');
    }

    _onBonusBuy(info) {
        this.emit('bonusBuy', info);
    }

    _disableControls() {
        this.spinButton.disableSpin();
        this.betSelector.disable();
        this.decreaseBetButton.disable();
        this.increaseBetButton.disable();
        this.autoPlayPanel.disable();
        this.bonusBuyPanel.disable();
        this.sideBetButton.disable();
    }

    _enableControls() {
        this.spinButton.enableSpin();
        this.betSelector.enable();
        this.decreaseBetButton.enable();
        this.increaseBetButton.enable();
        this.autoPlayPanel.enable();
        this.bonusBuyPanel.enable();
        this.sideBetButton.enable();
    }

    updateBalance(value) {
        this.valuesDisplay.updateBalance(value);
    }

    updateTotalWin(value) {
        this.valuesDisplay.updateWin(value);
    }

    disableControls() {
        this.spinButton.hideSpin();
        this.spinButton.showStop();
        this.spinButton.disableStop();
        this.betSelector.disable();
        this.decreaseBetButton.disable();
        this.increaseBetButton.disable();
        this.autoPlayPanel.disable();
        this.bonusBuyPanel.disable();
        this.sideBetButton.disable();
    }

    enableControls() {
        this.isSpinning = false;
        this.spinButton.showSpin();
        this.spinButton.hideStop();
        this.spinButton.enableStop();
        this.spinButton.enableSpin();
        this.betSelector.enable();
        this.decreaseBetButton.enable();
        this.increaseBetButton.enable();
        this.autoPlayPanel.enable();
        this.bonusBuyPanel.enable();
        this.sideBetButton.enable();
    }

    // Shows only the spin button so the player triggers the next step of the round
    enableSpinOnly() {
        this.isSpinning = false;
        this.spinButton.showSpin();
        this.spinButton.hideStop();
        this.spinButton.enableSpin();
    }

    disableForcedPlay(){
        this.forcedPlaySelector.disable()
    }

    enableForcedPlay(){
        this.forcedPlaySelector.enable()
    }

    resetForcedPlay(){
        this.forcedPlaySelector.reset()
    }

    hideSpinButton() {
        this.spinButton.hideSpin();
    }

    showSpinButton() {
        this.spinButton.showSpin();
    }

    showStopButton() {
        this.spinButton.showStop();
    }

    hideStopButton() {
        this.spinButton.hideStop();
    }

    enableStopButton() {
        this.spinButton.enableStop();
    }

    disableStopButton() {
        this.spinButton.disableStop();
    }

    showStopAutoPlay(rounds) {
        this.autoPlayPanel.showStopAutoPlay(rounds);
    }

    hideStopAutoPlay() {
        this.autoPlayPanel.hideStopAutoPlay();
    }

    updateRoundsLeft(rounds) {
        this.autoPlayPanel.updateRounds(rounds);
    }

    openBonusBuyStore() {
        this.bonusBuyPanel.openStore();
    }

    closeBonusBuyStore() {
        this.bonusBuyPanel.closeStore();
    }

    openBetContainer() {
        this.betSelector.openPanel();
    }

    closeBetContainer() {
        this.betSelector.closePanel();
    }

    openAutoPlayContainer() {
        this.autoPlayPanel.openPanel();
    }

    closeAutoPlayContainer() {
        this.autoPlayPanel.closePanel();
    }

    destroy() {
        this.mainContainer.destroy(true);
    }
}
