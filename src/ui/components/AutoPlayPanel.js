import { COLORS_LIST } from "../../constants/COLORS";
import { AUTOPLAY_BUTTONS } from "../../constants/UICoordinates";
import IconFactory from "../IconFactory";

export default class AutoPlayPanel {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onAutoPlay;
    /** @type {Function} */
    onStopAutoPlay;

    container;
    autoPlayIcon;
    autoPlayRounds;
    stopAutoPlayContainer;
    autoPlaysPanelContainer;
    isPanelOpen = false;

    constructor({ scene, onAutoPlay, onStopAutoPlay, config = {} }) {
        this.scene = scene;
        this.onAutoPlay = onAutoPlay;
        this.onStopAutoPlay = onStopAutoPlay;
        this.hideLabel = config.hideLabel || false;
        this.size = config.size || 'desktop';
        this.container = this._create();
    }

    _create() {
        const isMobile = this.size === 'mobile';
        const width = isMobile ? 110 : 140;
        const height = isMobile ? 70 : 55;
        const radius = isMobile ? 35 : 25;

        const autoPlayBG = this.scene.add.graphics();
        autoPlayBG.fillStyle(COLORS_LIST.bg_white);
        autoPlayBG.fillRoundedRect(0, 0, width, height, radius);

        const hitArea = this.scene.add.rectangle(0, 0, width, height, 0x0099ff, 0);
        hitArea.setOrigin(0, 0);
        hitArea.setInteractive({ useHandCursor: true });
        this._hitArea = hitArea;

        this.label = this.scene.add.text(width / 2, isMobile ? height - 8 : 72, "AUTO SPIN", {
            fontFamily: "Inter",
            fontSize: 18,
            fill: COLORS_LIST.text_white,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5).setVisible(!this.hideLabel);

        const icon = new IconFactory(this.scene, width / 2, height / 2, 'autoPlaySVG', {
            color: COLORS_LIST.text_black,
            size: isMobile ? 50 : 40
        });

        this.autoPlayIcon = icon;

        const stopSize = isMobile ? 60 : 50;
        const stopRadius = isMobile ? 30 : 25;
        const stopIconSize = isMobile ? 35 : 28;
        const stopYOffset = isMobile ? 0 : height / 2 - stopSize / 2;

        this.stopAutoPlayContainer = this.scene.add.container(isMobile ? width + 10 : -stopSize - 10, isMobile ? 0 : stopYOffset).setVisible(false);

        const newStopBG = this.scene.add.graphics();
        newStopBG.fillStyle(COLORS_LIST.bg_white);
        newStopBG.fillRoundedRect(0, 0, stopSize, stopSize, stopRadius);

        const newStopIcon = new IconFactory(this.scene, stopSize / 2, stopSize / 2, 'stopSVG', {
            color: COLORS_LIST.text_black,
            size: stopIconSize
        });

        const newStopHitArea = this.scene.add.rectangle(0, 0, stopSize, stopSize, 0x0099ff, 0);
        newStopHitArea.setOrigin(0, 0);
        newStopHitArea.setInteractive({ useHandCursor: true });
        this._stopHitArea = newStopHitArea;

        newStopHitArea.on('pointerup', () => {
            this.onStopAutoPlay();
            this.hideStopAutoPlay();
        });

        const counterSize = isMobile ? 24 : 20;
        this.stopRoundsCounter = this.scene.add.text(stopSize / 2, stopSize + 20, '10', {
            fontFamily: "Inter",
            fontSize: counterSize,
            fontStyle: "bold",
            fill: COLORS_LIST.accentHex,
            align: "center",
        }).setOrigin(0.5);

        this.stopAutoPlayContainer.add([newStopBG, newStopIcon.image, newStopHitArea, this.stopRoundsCounter]);

        hitArea.on('pointerup', () => {
            if (this.isPanelOpen) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        });

        hitArea.on('pointerover', () => {
            this.scene.audioManager.playHover()
            icon.setColor(COLORS_LIST.accentHex);
        });

        hitArea.on('pointerout', () => {
            if (this.isPanelOpen) return;
            icon.setColor(COLORS_LIST.text_black);
        });

        const btnWidth = isMobile ? 85 : 54;
        const btnHeight = isMobile ? 40 : 22;
        const btnSpacing = isMobile ? 8 : 4;
        const margin = isMobile ? 12 : 6;
        const panelWidth = isMobile ? (btnWidth + (margin * 2)) : 125;
        const panelHeight = isMobile ? ((btnHeight * 6) + (btnSpacing * 5) + (margin * 2)) : 93;

        this.autoPlaysPanelContainer = this.scene.add.container(isMobile ? 0 : 8, isMobile ? -332 : -121);
        this.autoPlaysPanelContainer.visible = false;
        this.autoPlaysPanelContainer.depth = 1;

        const autoPlayButtonsContainer = this.scene.add.container(0, 0).setDepth(1);
        const autoPlaysPanel = this.scene.add.graphics();
        autoPlaysPanel.fillStyle(COLORS_LIST.bg_black, 0.6);
        autoPlaysPanel.fillRoundedRect(0, 0, panelWidth, panelHeight, {
            tl: 10,
            tr: 10,
            bl: 0,
            br: 0
        });

        if (isMobile) {
            AUTOPLAY_BUTTONS.forEach((element, index) => {
                const { value } = element;
                const y = margin + (index * (btnHeight + btnSpacing));
                const button = this._createAutoPlayButton({ x: margin, y, value, isMobile });
                autoPlayButtonsContainer.add([button]);
            });
        } else {
            AUTOPLAY_BUTTONS.forEach((element) => {
                const { x, y, value } = element;
                const button = this._createAutoPlayButton({ x, y, value, isMobile });
                autoPlayButtonsContainer.add([button]);
            });
        }

        this.autoPlaysPanelContainer.add([autoPlaysPanel, autoPlayButtonsContainer]);

        const container = this.scene.add.container(0, 0);
        container.add([autoPlayBG, this.label, icon.image, hitArea, this.autoPlaysPanelContainer, this.stopAutoPlayContainer]);

        return container;
    }

    _createAutoPlayButton({ x, y, value, isMobile = false }) {
        const btnWidth = isMobile ? 85 : 54;
        const btnHeight = isMobile ? 40 : 22;
        const btnRadius = isMobile ? 12 : 11;

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0);
        bg.fillRoundedRect(0, 0, btnWidth, btnHeight, btnRadius);
        bg.lineStyle(1, 0xffffff, 1);
        bg.strokeRoundedRect(0, 0, btnWidth, btnHeight, btnRadius);

        const hitArea = this.scene.add.rectangle(3, 0, btnWidth - 6, btnHeight, 0x000000, 0);
        hitArea.setOrigin(0, 0);
        hitArea.setInteractive({ useHandCursor: true });

        const label = this.scene.add.text(btnWidth / 2, btnHeight / 2, value, {
            fontFamily: "Inter",
            fontSize: isMobile ? 18 : 14,
            fill: COLORS_LIST.text_white,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5);

        hitArea.on('pointerup', () => {
            this.showStopAutoPlay(value);
            this.closePanel();
            this.onAutoPlay(value);
        });

        hitArea.on('pointerover', () => {
            this.scene.audioManager.playHover({rate:1.8})
            bg.clear();
            bg.fillStyle(0x000000, 0.8);
            bg.fillRoundedRect(0, 0, btnWidth, btnHeight, btnRadius);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x000000, 0);
            bg.fillRoundedRect(0, 0, btnWidth, btnHeight, btnRadius);
            bg.lineStyle(1, 0xffffff, 1);
            bg.strokeRoundedRect(0, 0, btnWidth, btnHeight, btnRadius);
        });

        const container = this.scene.add.container(x, y);
        container.add([bg, hitArea, label]);
        container.depth = 1;

        return container;
    }

    getContainer() {
        return this.container;
    }

    openPanel() {
        this.autoPlayIcon.setColor(COLORS_LIST.accentHex);
        this.isPanelOpen = true;
        this.autoPlaysPanelContainer.visible = true;
    }

    closePanel() {
        this.isPanelOpen = false;
        this.autoPlaysPanelContainer.visible = false;
        this.autoPlayIcon.setColor(COLORS_LIST.text_black);
    }

    showStopAutoPlay(rounds) {
        if (this.stopRoundsCounter) {
            this.stopRoundsCounter.setText(rounds);
        }
        this.stopAutoPlayContainer.setVisible(true);
    }

    hideStopAutoPlay() {
        this.stopAutoPlayContainer.setVisible(false);
    }

    updateRounds(rounds) {
        if (this.stopRoundsCounter) {
            this.stopRoundsCounter.setText(rounds);
        }
    }

    enable() {
        if (this._hitArea) {
            this._hitArea.setInteractive({ useHandCursor: true });
        }
        if (this._stopHitArea) {
            this._stopHitArea.setInteractive({ useHandCursor: true });
        }
        this.container.setAlpha(1);
    }

    disable() {
        if (this.isPanelOpen) {
            this.closePanel();
        }
        if (this._hitArea) {
            this._hitArea.disableInteractive();
        }
        if (this.stopAutoPlayContainer && this.stopAutoPlayContainer.visible && this._stopHitArea) {
            this._stopHitArea.setInteractive({ useHandCursor: true });
            this.container.setAlpha(1);
        } else {
            this.container.setAlpha(0.5);
        }
    }
}
