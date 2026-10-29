import { COLORS_LIST } from "../../constants/COLORS";

export default class BetSelector {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onBetChange;
    /** @type {number} */
    currentBet;
    /** @type {number} */
    baseBet;
    /** @type {number} */
    currentMultiplier = 1;
    /** @type {number} */
    sideBetMultiplier = 1;
    /** @type {Array} */
    betValues;
    /** @type {number} */
    totalBet;
    /** @type {boolean} */
    isPanelOpen = false;

    container;
    betValue;
    betButtons = [];
    availableBetsPanelContainer;
    betHitArea;

    constructor({ scene, onBetChange, bet, availableBets, config = {} }) {
        this.scene = scene;
        this.onBetChange = onBetChange;
        this.currentBet = bet;
        this.baseBet = bet;
        this.betValues = availableBets;
        this.totalBet = Number((bet / 100).toFixed(2));
        this.config = config;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);
        container.depth = 1;

        this.betBtn = this.scene.add.graphics();
        this.betBtn.fillStyle(COLORS_LIST.bg_white, 0);
        this.betBtn.fillRoundedRect(0, -31, 140, 62, 12);
        this.betBtn.lineStyle(1, 0xffffff, 1);
        this.betBtn.strokeRoundedRect(0, -31, 140, 62, 10);

        const betHitArea = this.scene.add.rectangle(70, -31, 140, 62, 0x000000, 0);
        betHitArea.setOrigin(0.5, 0);
        betHitArea.setInteractive({ useHandCursor: true });
        this.betHitArea = betHitArea;
        this.betBtnContainer = this.scene.add.container(0, 0);
        this.betValue = this.scene.add.text(70, 0, "$" + (this.totalBet).toFixed(2), {
            fontFamily: "Inter",
            fontSize: 28,
            fill: COLORS_LIST.text_white,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5);
        this.betBtnContainer.add([this.betBtn, betHitArea, this.betValue]);

        betHitArea.on('pointerup', () => {
            if (this.isPanelOpen) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        });

        betHitArea.on('pointerover', () => {
            this.scene.audioManager.playHover()
            this.betValue.setColor(COLORS_LIST.accentHex);
        });

        betHitArea.on('pointerout', () => {
            if (this.isPanelOpen) return;
            if (this.currentMultiplier > 1) {
                this.betValue.setColor(COLORS_LIST.accentHex);
                this.betValue.setFontStyle('bold');
            } else {
                this.betValue.setColor(COLORS_LIST.text_white);
            }
        });

        const isMobile = this.config.isMobile;

        this.availableBetsPanelContainer = this.scene.add.container(
            this.config.panelOffsetX || -15,
            this.config.panelOffsetY || -42
        ).setVisible(false).setDepth(9999);

        const availableBetsContainer = this.scene.add.container(0, 0);
        const availableBetsPanel = this.scene.add.graphics();

        const BTN_WIDTH = isMobile ? 80 : 64;
        const BTN_HEIGHT = isMobile ? 40 : 32;
        const gapX = isMobile ? 90 : 75;
        const gapY = isMobile ? 50 : 40;
        const columns = isMobile ? 3 : 4;
        const padding = isMobile ? 20 : 10;

        const totalRows = Math.ceil(this.betValues.length / columns);
        const gridWidth = (columns - 1) * gapX + BTN_WIDTH;
        const gridHeight = (totalRows - 1) * gapY + BTN_HEIGHT;

        if (isMobile) {
            const panelWidth = 1080;
            this.availableBetsPanelContainer.x = 0;

            const columns_MOBILE = 3;
            const sidePadding = 40;
            const gapBetweenColumns = 20;
            const gapBetweenRows = 20;
            const btnsPerColumn = Math.ceil(this.betValues.length / columns_MOBILE);
            const btnWidth = (panelWidth - sidePadding * 2 - gapBetweenColumns * (columns_MOBILE - 1)) / columns_MOBILE;
            const btnHeight = 80;
            const rowsHeight = btnsPerColumn * btnHeight + (btnsPerColumn - 1) * gapBetweenRows;

            const closeBtnSize = 70;
            const closeBtnY = 15;
            const buttonsStartY = closeBtnY + closeBtnSize + 30;
            const panelHeight = buttonsStartY + rowsHeight + sidePadding + 30;

            this._mobilePanelHeight = panelHeight;

            const closeBtn = this.scene.add.graphics();
            closeBtn.fillStyle(0x666666, 0.8);
            closeBtn.fillRoundedRect(panelWidth - closeBtnSize - 30, closeBtnY, closeBtnSize, closeBtnSize, closeBtnSize / 2);
            const closeBtnX = panelWidth - closeBtnSize - 30;
            const closeIcon = this.scene.add.text(closeBtnX + closeBtnSize / 2, closeBtnY + closeBtnSize / 2, "X", {
                fontFamily: "Inter",
                fontSize: 32,
                fontStyle: "bold",
                fill: "#ffffff",
            }).setOrigin(0.5);
            const closeHitArea = this.scene.add.rectangle(closeBtnX + closeBtnSize / 2, closeBtnY + closeBtnSize / 2, closeBtnSize, closeBtnSize, 0x000000, 0);
            closeHitArea.setOrigin(0.5);
            closeHitArea.setInteractive({ useHandCursor: true });
            closeHitArea.on('pointerover', () => {
                closeBtn.clear();
                closeBtn.fillStyle(0xff4444, 0.9);
                closeBtn.fillRoundedRect(panelWidth - closeBtnSize - 30, closeBtnY, closeBtnSize, closeBtnSize, closeBtnSize / 2);
                closeIcon.setColor('#ffffff');
            });
            closeHitArea.on('pointerout', () => {
                closeBtn.clear();
                closeBtn.fillStyle(0x666666, 0.8);
                closeBtn.fillRoundedRect(panelWidth - closeBtnSize - 30, closeBtnY, closeBtnSize, closeBtnSize, closeBtnSize / 2);
                closeIcon.setColor('#ffffff');
            });
            closeHitArea.on('pointerup', (pointer) => {
                pointer.event.stopPropagation();
                this.closePanel();
            });

            availableBetsPanel.fillStyle(COLORS_LIST.bg_black, 0.95);
            availableBetsPanel.fillRoundedRect(0, 0, panelWidth, panelHeight, {
                tl: 30,
                tr: 30,
                bl: 0,
                br: 0
            });

            availableBetsContainer.setPosition(0, buttonsStartY);

            this._mobilePanelTargetY = this.config.mobileOpenY ?? (1800 - panelHeight);
            this.availableBetsPanelContainer.y = this.config.panelStartY || 1920;
            this.availableBetsPanelContainer.setVisible(false);

            this._createBetButtonsMobile(availableBetsContainer, columns_MOBILE, sidePadding, btnWidth, btnHeight, gapBetweenRows, gapBetweenColumns, panelWidth);

            const panelChildren = [availableBetsPanel, availableBetsContainer, closeBtn, closeIcon, closeHitArea];

            this.availableBetsPanelContainer.add(panelChildren);
        } else {
            availableBetsPanel.fillStyle(COLORS_LIST.bg_black, 0.6);
            availableBetsPanel.fillRoundedRect(0, 0, gridWidth + padding * 2, gridHeight + padding * 2, {
                tl: 10,
                tr: 10,
                bl: 0,
                br: 0
            });
            availableBetsContainer.setPosition(padding, padding);
            this.availableBetsPanelContainer.x = this.config.panelOffsetX ?? -15;
            this.availableBetsPanelContainer.y = this.config.panelOffsetY || (-gridHeight - padding - 12);

            this.betButtons = [];
            for (let i = 0; i < this.betValues.length; i++) {
                const col = i % columns;
                const row = Math.floor(i / columns);
                const x = col * gapX;
                const y = row * gapY;
                const value = (this.currentBet * this.betValues[i].multiplier / 100).toFixed(2);

                const button = this._createBetValueButton({
                    x,
                    y,
                    value,
                    multiplier: this.betValues[i].multiplier,
                    baseValue: this.betValues[i].value,
                    isMobile: false
                });

                this.betButtons.push({
                    textObj: button,
                    baseMultiplier: this.betValues[i].multiplier,
                    baseValue: this.betValues[i].value,
                });

                availableBetsContainer.add(button);
            }
        }

        if (isMobile) {
            container.add(this.betBtnContainer);
            if (this.config.scale) {
                this.betBtnContainer.setScale(this.config.scale);
            }
        } else {
            container.add([
                this.betBtnContainer,
                this.availableBetsPanelContainer
            ]);
            this.availableBetsPanelContainer.add([availableBetsPanel, availableBetsContainer]);
            if (this.config.scale) {
                container.setScale(this.config.scale);
            }
        }

        return container;
    }

    getPanelContainer() {
        return this.availableBetsPanelContainer;
    }
    _createBetValueButton({ x, y, value, multiplier, baseValue, isMobile = false, customWidth = null, customHeight = null }) {
        const BTN_WIDTH = customWidth || (isMobile ? 150 : 64);
        const BTN_HEIGHT = customHeight || (isMobile ? 80 : 32);
        const fontSize = isMobile ? 32 : 16;

        const radius = isMobile ? 25 : 11;

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0);
        bg.lineStyle(1, 0xffffff, 1);
        bg.fillRoundedRect(0, 0, BTN_WIDTH, BTN_HEIGHT, radius);
        bg.strokeRoundedRect(0, 0, BTN_WIDTH, BTN_HEIGHT, radius);

        const hitArea = this.scene.add.rectangle(0, 0, BTN_WIDTH, BTN_HEIGHT, 0x000000, 0)
            .setOrigin(0);

        hitArea.setInteractive({ useHandCursor: true });

        const label = this.scene.add.text(BTN_WIDTH / 2, BTN_HEIGHT / 2, "$" + value, {
            fontFamily: "Inter",
            fontSize: fontSize,
            fill: COLORS_LIST.text_white,
            align: "center",
        }).setOrigin(0.5);

        hitArea.on('pointerover', () => {
            this.scene.audioManager.playHover({rate: 1.8})
            const isSideBet = this.sideBetMultiplier > 1;
            this.drawButton(bg, BTN_WIDTH, BTN_HEIGHT, radius, isSideBet, true);
        });

        hitArea.on('pointerout', () => {
            const isSideBet = this.sideBetMultiplier > 1;
            this.drawButton(bg, BTN_WIDTH, BTN_HEIGHT, radius, isSideBet, false);
        });

        hitArea.on('pointerup', () => {
            this.setTotalBet(baseValue / 100);
            this.closePanel();
        });

        const container = this.scene.add.container(x, y);
        container.add([bg, hitArea, label]);
        container.bg = bg;
        container.label = label;
        container.btnWidth = BTN_WIDTH;
        container.btnHeight = BTN_HEIGHT;
        container.radius = radius;

        return container;
    }

    drawButton(bg, width, height, radius, isSideBet = false, isHover = false) {
        bg.clear();
        const borderWidth = isSideBet ? 2 : 1;
        const borderColor = isSideBet ? COLORS_LIST.accent : 0xffffff;
        bg.lineStyle(borderWidth, borderColor, 1);
        if (isHover) {
            bg.fillStyle(0x000000, 0.5);
        } else {
            bg.fillStyle(0x000000, 0);
        }
        bg.fillRoundedRect(0, 0, width, height, radius);
        bg.strokeRoundedRect(0, 0, width, height, radius);
    }

    setSideBetActive(isActive) {
        if (this.betValue) {
            this.betValue.setColor(isActive ? COLORS_LIST.accentHex : COLORS_LIST.text_white);
        }
        if (!this.betButtons) return;
        this.betButtons.forEach((element) => {
            const container = element.textObj;
            if (container && container.bg) {
                this.drawButton(container.bg, container.btnWidth, container.btnHeight, container.radius, isActive);
                const label = container.list[2];
                if (label) {
                    label.setColor(isActive ? COLORS_LIST.accentHex : COLORS_LIST.text_white);
                }
            }
        });
    }

    _createBetButtonsMobile(container, columns, sidePadding, btnWidth, btnHeight, gapBetweenRows, gapBetweenColumns, panelWidth) {
        this.betButtons = [];

        for (let i = 0; i < this.betValues.length; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const x = sidePadding + col * (btnWidth + gapBetweenColumns);
            const y = row * (btnHeight + gapBetweenRows);
            const value = (this.currentBet * this.betValues[i].multiplier / 100).toFixed(2);

            const button = this._createBetValueButton({
                x,
                y,
                value,
                multiplier: this.betValues[i].multiplier,
                baseValue: this.betValues[i].value,
                isMobile: true,
                customWidth: btnWidth,
                customHeight: btnHeight
            });

            this.betButtons.push({
                textObj: button,
                baseMultiplier: this.betValues[i].multiplier,
                baseValue: this.betValues[i].value,
            });

            container.add(button);
        }
    }

    _refreshBetButtonValues() {
        if (!this.betButtons) return;
        this.betButtons.forEach((element) => {
            const container = element.textObj;
            const text = container.list[2];
            if (text) {
                const baseValue = element.baseValue;
                const totalValue = (baseValue * this.sideBetMultiplier / 100).toFixed(2);
                text.setText(`$${totalValue}`);
            }
        });
    }

    getContainer() {
        return this.container;
    }

    openPanel() {
        this.isPanelOpen = true;
        this.betValue.setColor(COLORS_LIST.accentHex);
        this.betValue.setFontStyle('bold');
        this.availableBetsPanelContainer.visible = true;

        if (this.config.isMobile) {
            const panelBottom = 1640;
            const panelTop = panelBottom - this._mobilePanelHeight;
            const topHandleHeight = 80;
            const topHandleY = panelTop - topHandleHeight / 2;
            const bottomY = panelBottom;
            const bottomHeight = 1920 - panelBottom;

            if (!this._blockerTop) {
                this._blockerTop = this.scene.add.rectangle(540, topHandleY, 1080, topHandleHeight, 0x000000, 0.01);
                this._blockerTop.setDepth(9997);
                this._blockerTop.setInteractive();
                this._blockerTop.on('pointerup', () => this.closePanel());
            }
            if (!this._blockerBottom) {
                this._blockerBottom = this.scene.add.rectangle(540, bottomY + bottomHeight / 2, 1080, bottomHeight, 0x000000, 0.01);
                this._blockerBottom.setDepth(9997);
                this._blockerBottom.setInteractive();
                this._blockerBottom.on('pointerup', () => this.closePanel());
            }

            this._blockerTop.setVisible(true);
            this._blockerTop.setSize(1080, topHandleHeight);
            this._blockerTop.setPosition(540, topHandleY);

            this._blockerBottom.setVisible(true);
            this._blockerBottom.setSize(1080, bottomHeight);
            this._blockerBottom.setPosition(540, bottomY + bottomHeight / 2);

            const targetY = this._mobilePanelTargetY || 1200;
            this.scene.tweens.add({
                targets: this.availableBetsPanelContainer,
                y: targetY,
                duration: 300,
                ease: 'Cubic.easeOut'
            });
        }
    }

    closePanel() {
        this.isPanelOpen = false;
        this.betValue.setFontStyle(300);
        if (this.currentMultiplier > 1) {
            this.betValue.setColor(COLORS_LIST.accentHex);
            this.betValue.setFontStyle('bold');
        } else {
            this.betValue.setColor(COLORS_LIST.text_white);
        }

        if (this._blockerTop) this._blockerTop.setVisible(false);
        if (this._blockerBottom) this._blockerBottom.setVisible(false);

        if (this.config.isMobile) {
            this.scene.tweens.add({
                targets: this.availableBetsPanelContainer,
                y: this.config.panelStartY || 1920,
                duration: 200,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                    this.availableBetsPanelContainer.visible = false;
                }
            });
        } else {
            this.availableBetsPanelContainer.visible = false;
        }
    }

    setTotalBet(value) {
        this.baseBet = value * 100;
        this.totalBet = value * this.currentMultiplier;
        this.betValue.setText("$" + this.totalBet.toFixed(2));
        this.onBetChange(this.baseBet);
    }

    setSideBetMultiplier(multiplier) {
        this.currentMultiplier = multiplier;
        this.sideBetMultiplier = multiplier;
        this.totalBet = (this.baseBet / 100) * this.currentMultiplier;
        this.betValue.setText("$" + this.totalBet.toFixed(2));
        this.setSideBetActive(multiplier > 1);
        this._refreshBetButtonValues();
    }

    enable() {
        this.betValue.setAlpha(1);
        this.betHitArea.setInteractive({ cursor: "pointer" });
    }

    disable() {
        if (this.isPanelOpen) {
            this.closePanel();
        }
        this.betValue.setAlpha(0.5);
        this.betHitArea.disableInteractive();
    }
}
