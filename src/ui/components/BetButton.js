import { COLORS_LIST } from "../../constants/COLORS";

export default class BetButton {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onClick;
    /** @type {'increase' | 'decrease'} */
    type;

    container;
    icon;

    constructor({ scene, type, onClick, config = {} }) {
        this.scene = scene;
        this.type = type;
        this.onClick = onClick;
        this.config = config;

        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);

        const width = this.config.width || 62;
        const height = this.config.height || 62;
        const radius = this.config.radius || 10;
        const text = this.type === 'increase' ? '+' : '-';
        const iconSize = this.config.iconSize || 84;
        const fontSize = this.config.fontSize || 100;
        const offsetY = -height / 2;

        const bg = this.scene.add.graphics();
        const bgColor = this.type === 'increase' ? COLORS_LIST.bg_black : COLORS_LIST.bg_white;
        const textColor = this.type === 'increase' ? COLORS_LIST.text_white : COLORS_LIST.text_black;
        bg.fillStyle(bgColor);
        bg.fillRoundedRect(0, offsetY, width, height, radius);

        const label = this.scene.add.text(width / 2, -3, text, {
            fontFamily: "Inter",
            fontSize: fontSize,
            fill: textColor,
            align: "center",
        }).setOrigin(0.5).setScale(0.6);

        const hitArea = this.scene.add.rectangle(width / 2, 0, width, height, 0xff0000, 0);
        hitArea.setOrigin(0.5);
        hitArea.setInteractive({ useHandCursor: true });
        this._hitArea = hitArea;

        hitArea.on('pointerup', () => {
            this.onClick();
        });

        hitArea.on('pointerover', () => {
            this.scene.audioManager.playHover()
            label.setColor(COLORS_LIST.accentHex);
        });

        hitArea.on('pointerout', () => {
            label.setColor(textColor);
        });

        container.add([bg, label, hitArea]);

        return container;
    }

    getContainer() {
        return this.container;
    }

    disable() {
        if (this._hitArea) {
            this._hitArea.disableInteractive();
        } else {
            this.container.list.forEach(child => {
                if (child.input) child.disableInteractive();
            });
        }
        this.container.setAlpha(0.5);
    }

    enable() {
        if (this._hitArea) {
            this._hitArea.setInteractive({ useHandCursor: true });
        } else {
            this.container.list.forEach(child => {
                if (child.input) child.setInteractive({ useHandCursor: true });
            });
        }
        this.container.setAlpha(1);
    }
}
