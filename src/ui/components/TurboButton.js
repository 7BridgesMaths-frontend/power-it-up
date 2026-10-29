import { COLORS_LIST } from "../../constants/COLORS";
import IconFactory from "../IconFactory";

export default class TurboButton {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onToggle;
    /** @type {boolean} */
    isTurbo = false;

    container;
    icon;
    label;

    constructor({ scene, onToggle, config = {} }) {
        this.scene = scene;
        this.onToggle = onToggle;
        this.hideLabel = config.hideLabel || false;
        this.radius = config.radius || 34;
        this.iconSize = config.iconSize || 36;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);

        const bg = this.scene.add.circle(0, 0, this.radius, COLORS_LIST.bg_black)
            .setOrigin(0.5)
            .setInteractive({ cursor: "pointer" });

        const glow = this.scene.add.circle(0, 0, this.radius, COLORS_LIST.accent, 0.6)
            .setOrigin(0.5)
            .setAlpha(0);

        const icon = new IconFactory(this.scene, 0, 0, 'turboPlaySVG', {
            color: COLORS_LIST.text_white,
            size: this.iconSize
        });
        this.icon = icon;

        this.label = this.scene.add.text(0, 55 + (this.radius - 34) * 0.5, "TURBO", {
            fontFamily: "Inter",
            fontSize: 32,
            fill: COLORS_LIST.text_white,
            align: "center",
        }).setOrigin(0.5).setScale(0.6).setVisible(!this.hideLabel);

        container.add([glow, bg, icon.image, this.label]);

        bg.on('pointerup', () => {
            this.isTurbo = !this.isTurbo;
            this.onToggle(this.isTurbo);

            icon.setColor(this.isTurbo ? COLORS_LIST.accentHex : COLORS_LIST.text_white);
            this.label.setColor(this.isTurbo ? COLORS_LIST.accentHex : COLORS_LIST.text_white);

            this.scene.tweens.add({
                targets: glow,
                alpha: this.isTurbo ? 1 : 0,
                ease: 'Sine.InOut',
                duration: 100,
            });
        });

        bg.on('pointerover', () => {
            this.scene.audioManager.playHover()
            this.scene.tweens.add({
                targets: bg,
                scale: 0.96,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        bg.on('pointerout', () => {
            if (this.isTurbo) return;
            this.scene.tweens.add({
                targets: bg,
                scale: 1,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        return container;
    }

    getContainer() {
        return this.container;
    }

    setTurbo(value) {
        this.isTurbo = value;
        this.icon.setColor(this.isTurbo ? COLORS_LIST.accentHex : COLORS_LIST.text_white);
    }
}
