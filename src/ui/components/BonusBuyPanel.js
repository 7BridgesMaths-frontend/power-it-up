import { SCATTER_ID } from "../../constants/IDs";
import { COLORS_LIST } from "../../constants/COLORS";
import IconFactory from "../IconFactory";
import SymbolView from "../../features/symbols/SymbolView";

export default class BonusBuyPanel {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onBonusBuy;
    /** @type {Array} */
    bonusBuyElements;

    container;
    bonusBuyStoreContainer;
    bonusBuyBTN;
    bonusBuyBTN_TEXT;

    constructor({ scene, onBonusBuy, bonusBuyElements, isMobile = false }) {
        this.scene = scene;
        this.onBonusBuy = onBonusBuy;
        this.bonusBuyElements = bonusBuyElements;
        this.isMobile = isMobile;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);
        if (this.bonusBuyElements.length == 0) return container;

        this.bonusBuyStoreContainer = this.scene.add.container(0, 0).setDepth(10000).setVisible(false);
        this._createBonusBuyStore();

        this.bonusBuyBTN = this.scene.add.circle(0, 0, 55, COLORS_LIST.bg_white)
            .setOrigin(0.5)
            .setName("BB_bg")
            .setInteractive({ cursor: "pointer" });

        this.bonusBuyBTN_TEXT = this.scene.add.text(0, 3, "BONUS\n BUY", {
            fontFamily: "Inter",
            fontSize: 24,
            fontStyle: "bold",
            fill: COLORS_LIST.text_black,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5);

        container.add([this.bonusBuyBTN, this.bonusBuyBTN_TEXT]);

        this.bonusBuyBTN.on('pointerup', () => {
            this.openStore();
        });

        this.bonusBuyBTN.on('pointerover', () => {
            this.scene.audioManager.playHover({rate: 1.03,detune: 40})
            this.scene.tweens.add({
                targets: [this.bonusBuyBTN, this.bonusBuyBTN_TEXT],
                scale: 0.97,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        this.bonusBuyBTN.on('pointerout', () => {
            this.scene.tweens.add({
                targets: [this.bonusBuyBTN, this.bonusBuyBTN_TEXT],
                scale: 1,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        return container;
    }

    _createBonusBuyStore() {
        const isMobile = this.isMobile;
        const screenW = isMobile ? 1080 : 1920;
        const screenH = isMobile ? 1920 : 1080;
        const numCards = this.bonusBuyElements.length;

        let cardWidth, cardHeight, cardGap, storeW, storeH, cardsPerRow, cardScale;

        if (isMobile) {
            cardWidth = 900;
            cardHeight = 180;
            cardGap = 30;
            storeW = 960;
            cardsPerRow = 1;
            cardScale = 1;
        } else {
            cardWidth = 385;
            cardHeight = 530;
            cardGap = 20;
            storeW = 1290;
            storeH = 760;
            if (numCards <= 3) {
                cardsPerRow = numCards;
                cardScale = 1;
            } else {
                cardsPerRow = Math.ceil(Math.sqrt(numCards));
                const maxWidth = storeW - 60;
                const maxHeight = storeH - 60;
                const widthScale = (maxWidth - (cardsPerRow - 1) * cardGap) / (cardsPerRow * cardWidth);
                const rows = Math.ceil(numCards / cardsPerRow);
                const heightScale = (maxHeight - (rows - 1) * cardGap) / (rows * cardHeight);
                cardScale = Math.min(1, widthScale, heightScale);
            }
        }

        const effectiveCardWidth = cardWidth * cardScale;
        const effectiveCardHeight = cardHeight * cardScale;
        const effectiveCardGap = cardGap * cardScale;
        const rows = Math.ceil(numCards / cardsPerRow);
        const totalWidth = cardsPerRow * effectiveCardWidth + (cardsPerRow - 1) * effectiveCardGap;
        const totalHeight = rows * effectiveCardHeight + (rows - 1) * effectiveCardGap;

        if (isMobile) {
            storeH = Math.min(1920 - 400, (numCards * (cardHeight + cardGap)) + 80);
        } else {
            storeH = Math.max(200, totalHeight + 60 + 80);
        }

        const storeX = (screenW - storeW) / 2;
        const storeY = isMobile ? (screenH - storeH) / 2 : (1080 - storeH) / 2;
        const closeButtonX = storeX + storeW - 50;
        const closeButtonY = storeY + 50;
        const closeButtonSize = isMobile ? 50 : 40;

        const headerHeight = 80;
        const startX = (storeW - totalWidth) / 2;
        const startY = headerHeight + (storeH - headerHeight - totalHeight) / 2;

        const layerBackground = this.scene.add.graphics();
        layerBackground.fillStyle('#fff', 0.5);
        layerBackground.fillRect(0, 0, screenW, screenH);
        // Swallows clicks so they don't reach the reels behind the store
        layerBackground.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, screenW, screenH),
            Phaser.Geom.Rectangle.Contains
        );
        layerBackground.on('pointerup', (pointer, localX, localY, event) => {
            event.stopPropagation();
        });

        const storeContainer = this.scene.add.graphics();
        storeContainer.fillStyle(COLORS_LIST.container);
        storeContainer.fillRoundedRect(storeX, storeY, storeW, storeH, 16);
        storeContainer.lineStyle(2, 0xffffff, 1);
        storeContainer.strokeRoundedRect(storeX, storeY, storeW, storeH, 16);

        const closeButton = new IconFactory(this.scene, closeButtonX, closeButtonY, 'closeSVG', {
            color: COLORS_LIST.text_white,
            size: closeButtonSize
        });

        closeButton.image.setOrigin(0.5).setName('close_icon');
        closeButton.image.setInteractive({ cursor: "pointer" });
        closeButton.image.on('pointerup', () => {
            this.closeStore();
        });
        closeButton.image.on('pointerover', () => {
            this.scene.audioManager.playHover({rate: 0.97,detune: -50})
            closeButton.setColor("#7a7a7a");
        });
        closeButton.image.on('pointerout', () => {
            closeButton.setColor(COLORS_LIST.text_white);
        });

        const cardsContainer = this.scene.add.container(storeX, storeY);

        this.bonusBuyElements.forEach((el, index) => {
            const { title, description, price, type, priceType, texture } = el;
            const col = index % cardsPerRow;
            const row = Math.floor(index / cardsPerRow);
            const x = startX + col * (effectiveCardWidth + effectiveCardGap);
            const y = startY + row * (effectiveCardHeight + effectiveCardGap);

            const bbElement = this._createBonusBuyCard({
                x,
                y,
                title,
                desc: description,
                price,
                type,
                priceType,
                texture: texture || `sym_${SCATTER_ID}`,
                isMobile,
                scale: cardScale
            });

            cardsContainer.add([bbElement]);
        });

        this.bonusBuyStoreContainer.add([layerBackground, storeContainer, cardsContainer, closeButton.image]);
    }

    _createBonusBuyCard({ x, y, title, desc, price, type, priceType, texture = `sym_${SCATTER_ID}`, isMobile = false, scale = 1 }) {
        const CARD_WIDTH = isMobile ? 900 : 385;
        const CARD_HEIGHT = isMobile ? 180 : 530;
        const BUTTON_WIDTH = isMobile ? 280 : 385;
        const BUTTON_HEIGHT = isMobile ? CARD_HEIGHT : 75;
        const imageSize = isMobile ? 120 : 0;
        const imageX = isMobile ? 90 : CARD_WIDTH / 2;
        const imageY = isMobile ? CARD_HEIGHT / 2 : 140;
        const titleX = isMobile ? 200 : CARD_WIDTH / 2;
        const titleY = isMobile ? CARD_HEIGHT / 2 - 25 : 300;
        const descX = isMobile ? 200 : CARD_WIDTH / 2;
        const descY = isMobile ? CARD_HEIGHT / 2 + 25 : 350;
        const buyTextX = isMobile ? CARD_WIDTH - BUTTON_WIDTH / 2 : CARD_WIDTH / 2;
        const buyTextY = isMobile ? CARD_HEIGHT / 2 : CARD_HEIGHT - BUTTON_HEIGHT / 2;

        const card = this.scene.add.graphics();
        card.fillStyle(0xFFFFFF);
        card.fillRoundedRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 16);

        this.btnBuyStore = this.scene.add.graphics();
        this.btnBuyStore.fillStyle(COLORS_LIST.buyStore);
        if (isMobile) {
            this.btnBuyStore.fillRoundedRect(CARD_WIDTH - BUTTON_WIDTH, 0, BUTTON_WIDTH, BUTTON_HEIGHT, {
                tl: 0,
                tr: 16,
                bl: 0,
                br: 16
            });
        } else {
            this.btnBuyStore.fillRoundedRect(0, CARD_HEIGHT - BUTTON_HEIGHT, CARD_WIDTH, BUTTON_HEIGHT, {
                tl: 0,
                tr: 0,
                bl: 16,
                br: 16
            });
        }

        const hitAreaX = isMobile ? CARD_WIDTH - BUTTON_WIDTH : 0;
        const hitAreaY = isMobile ? 0 : CARD_HEIGHT - BUTTON_HEIGHT;
        const hitArea = this.scene.add.rectangle(hitAreaX, hitAreaY, BUTTON_WIDTH, BUTTON_HEIGHT, 0x000000, 0);
        hitArea.setOrigin(0, 0);
        hitArea.setInteractive({ useHandCursor: true });

        // pointerup (not pointerdown): closing the store on press would let the release land on a symbol
        hitArea.on('pointerup', () => {
            this.buyBonus(type, price, priceType);
        });

        const buyPrice = priceType == "fixed" ? `BUY $${price}` : `BUY ${price}x`;

        const buyText = this.scene.add.text(buyTextX, buyTextY, buyPrice, {
            fontFamily: "Inter",
            fontSize: isMobile ? 38 : 40,
            fill: COLORS_LIST.text_white,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5);

        const buyTitle = this.scene.add.text(titleX, titleY, title, {
            fontFamily: "Inter",
            fontSize: isMobile ? 32 : 32,
            fontStyle: "bold",
            fill: COLORS_LIST.text_black,
            align: isMobile ? "left" : "center",
            lineSpacing: -4,
        }).setOrigin(isMobile ? 0 : 0.5, 0.5);

        const buyDescription = this.scene.add.text(descX, descY, desc, {
            fontFamily: "Inter",
            fontSize: isMobile ? 22 : 20,
            fill: COLORS_LIST.text_black,
            align: isMobile ? "left" : "center",
            lineSpacing: -4,
        }).setOrigin(isMobile ? 0 : 0.5, 0.5);

        const buyImage = this.scene.add.sprite(imageX, imageY, 'symbols', texture);
        if (isMobile) {
            buyImage.setDisplaySize(imageSize, imageSize);
        }

        const cardContainer = this.scene.add.container(x, y);
        if (scale !== 1) {
            cardContainer.setScale(scale);
        }
        cardContainer.add([card, this.btnBuyStore, buyText, buyTitle, buyDescription, buyImage, hitArea]);

        return cardContainer;
    }

    getContainer() {
        return this.container;
    }

    openStore() {
        SymbolView.disablePaytable();
        this.bonusBuyStoreContainer.visible = true;
    }

    closeStore() {
        this.scene.tweens.add({
            targets: [this.bonusBuyBTN, this.bonusBuyBTN_TEXT],
            scale: 1,
            ease: 'SineInOut',
            duration: 50,
        });
        this.bonusBuyStoreContainer.visible = false;
        SymbolView.enablePaytable();
    }

    buyBonus(type, cost, priceType) {
        this.closeStore();
        this.onBonusBuy({ type, cost, priceType });
    }

    enable() {
        if (this.bonusBuyElements.length == 0) return;
        const [button, text] = this.container.list;
        button.setInteractive({ cursor: "pointer" });
        text.setAlpha(1);
    }

    disable() {
        if (this.bonusBuyElements.length == 0) return;
        const [button, text] = this.container.list;
        button.disableInteractive();
        text.setAlpha(0.5);
    }
}
