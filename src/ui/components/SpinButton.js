import { COLORS_LIST } from "../../constants/COLORS";
import IconFactory from "../IconFactory";

export default class SpinButton {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onSpinClick;
    /** @type {Function} */
    onStopClick;
    /** @type {object} */
    config;

    spinButtonContainer;
    stopButtonContainer;
    spinButtonIsLocked = false;

    constructor({ scene, onSpinClick, onStopClick, config = {} }) {
        this.scene = scene;
        this.onSpinClick = onSpinClick;
        this.onStopClick = onStopClick;
        this.config = config;

        this._createSpinButton();
        this._createStopButton();
    }

    _createSpinButton() {
        this.spinButtonIsLocked = false;

        const radius = this.config.radius || 80;
        const iconSize = this.config.iconSize || 120;

        this.btnSpinBackground = this.scene.add.circle(3, 0, radius, COLORS_LIST.bg_black)
            .setOrigin(0.5)
            .setName('spin_bg');

        const spinIcon = new IconFactory(this.scene, 0, 0, 'spinSVG', {
            color: '#fff',
            size: iconSize
        });

        spinIcon.image.setOrigin(0.5).setName('spin_icon');
        this.btnSpin = spinIcon;

        this.spinButtonContainer = this.scene.add.container(0, 0);

        this.btnSpinBackground.setInteractive({ cursor: "pointer" });
        this.btnSpinBackground.on('pointerup', (p, x, y, e) => {
            if (this.spinButtonIsLocked) {
                e.stopPropagation();
                return;
            }
            this.onSpinClick();
        });
        this.btnSpinBackground.on('pointerover', (p, x, y, e) => {
            if (this.spinButtonIsLocked) return;
            this.btnSpin.setColor(COLORS_LIST.accentHex);
            this.scene.tweens.add({
                targets: [this.btnSpinBackground, this.btnSpin.image],
                scale: 0.99,
                ease: 'SineInOut',
                duration: 50,
            });
        });
        this.btnSpinBackground.on('pointerout', () => {
            this.btnSpin.setColor(COLORS_LIST.text_white);
            this.scene.tweens.add({
                targets: [this.btnSpinBackground, this.btnSpin.image],
                scale: 1,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        this.spinButtonContainer.add([this.btnSpinBackground, spinIcon.image]);
    }

    _createStopButton() {
        this.stopButtonContainer = this.scene.add.container(0, 0);

        const radius = this.config.radius || 80;
        const iconSize = this.config.stopIconSize || (this.config.iconSize || 120) * 0.8;

        const bg = this.scene.add.circle(3, 0, radius, COLORS_LIST.bg_black)
            .setOrigin(0.5)
            .setName('spin_bg');

        this.stopButtonIcon = new IconFactory(this.scene, 3, 0, 'stopSVG', {
            color: '#fff',
            size: iconSize
        });

        bg.setInteractive({ cursor: "pointer" });
        bg.on('pointerup', () => {
            this.onStopClick();
        });
        bg.on('pointerover', () => {
            if (this.isLocked) return;
            this.stopButtonIcon.setColor(COLORS_LIST.accentHex);
            this.scene.tweens.add({
                targets: [bg, this.stopButtonIcon.image],
                scale: 0.99,
                ease: 'SineInOut',
                duration: 50,
            });
        });
        bg.on('pointerout', () => {
            this.stopButtonIcon.setColor(COLORS_LIST.text_white);
            this.scene.tweens.add({
                targets: [bg, this.stopButtonIcon.image],
                scale: 1,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        this.stopButtonContainer.add([bg, this.stopButtonIcon.image]);
        this.stopButtonContainer.setVisible(false);
    }

    getSpinContainer() {
        return this.spinButtonContainer;
    }

    getStopContainer() {
        return this.stopButtonContainer;
    }

    enableSpin() {
        const [bg, icon] = this.spinButtonContainer.getAll();
        this.btnSpinBackground.input.cursor = 'pointer';
        this.spinButtonIsLocked = false;
        icon.clearTint();
    }

    disableSpin() {
        const [bg, icon] = this.spinButtonContainer.getAll();
        this.btnSpin.setColor(COLORS_LIST.text_white);
        icon.setTint(0x666666);
        this.btnSpinBackground.input.cursor = 'default';
        this.spinButtonIsLocked = true;
    }

    enableStop() {
        const [bg, icon] = this.stopButtonContainer.getAll();
        bg.setInteractive({ cursor: "pointer" });
        icon.clearTint();
        icon.setVisible(true);
    }

    disableStop() {
        const [bg, icon] = this.stopButtonContainer.getAll();
        bg.disableInteractive();
        this.stopButtonIcon.setColor(COLORS_LIST.text_white);
        icon.setTint(0x666666);
    }

    showSpin() {
        this.spinButtonContainer.setVisible(true);
    }

    hideSpin() {
        this.spinButtonContainer.setVisible(false);
    }

    showStop() {
        this.stopButtonContainer.setVisible(true);
    }

    hideStop() {
        this.stopButtonContainer.setVisible(false);
    }
}
