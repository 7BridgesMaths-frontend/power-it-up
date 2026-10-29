import { COLORS_LIST } from "../../constants/COLORS";

export default class SideBetButton {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onToggle;
    /** @type {boolean} */
    sideBet = false;
    /** @type {Array} */
    sideBets = [];
    /** @type {number} */
    currentIndex = -1;
    /** @type {number} */
    sideBetValue;
    /** @type {boolean} */
    hasSideBet;

    container;
    sideBetBtn;
    glow;
    text;
    label;

    constructor({ scene, onToggle, sideBetValue, sideBets = null, isMobile = false }) {
        this.scene = scene;
        this.onToggle = onToggle;
        this.sideBetValue = sideBetValue;
        this.isMobile = isMobile;

        if (Array.isArray(sideBets) && sideBets.length > 0) {
            this.sideBets = sideBets.map(s => {
                if (typeof s === 'object') return s;
                return { id: `sidebet_${s}`, name: `${s}x`, multiplier: s };
            });
        } else if (sideBetValue) {
            this.sideBets = [{ id: 'default', name: `${sideBetValue}x`, multiplier: sideBetValue }];
        }
        this.hasSideBet = this.sideBets.length > 0;
        this.container = this._create();
    }

    _create() {
        if (!this.hasSideBet) {
            return this.scene.add.container(0, 0);
        }

        const container = this.scene.add.container(0, 0);
        const radius = this.isMobile ? 55 : 34;
        const dollarScale = this.isMobile ? 0.8 : 0.5;
        const labelScale = this.isMobile ? 0.8 : 0.6;
        const labelY = this.isMobile ? 80 : 55;

        const bg = this.scene.add.circle(0, 0, radius, COLORS_LIST.bg_black)
            .setOrigin(0.5)
            .setName("sidebet_bg")
            .setInteractive({ cursor: "pointer" });

        this.sideBetBtn = bg;

        this.glow = this.scene.add.circle(
            0,
            0,
            radius,
            COLORS_LIST.accent,
            0.6
        ).setOrigin(0.5)
            .setAlpha(0);

        this.text = this.scene.add.text(0, 0, "$", {
            fontFamily: "Inter",
            fontSize: 80,
            fill: COLORS_LIST.text_white,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5).setScale(dollarScale);

        this.label = this.scene.add.text(1, labelY, "SIDE BET", {
            fontFamily: "Inter",
            fontSize: 32,
            fill: COLORS_LIST.text_white,
            align: "center",
            lineSpacing: -4,
        }).setOrigin(0.5).setScale(labelScale);

        container.add([this.glow, bg, this.text, this.label]);

        bg.on('pointerup', () => {
            this.toggle();
        });
        bg.on('pointerover', () => {
            this.scene.audioManager.playHover()
            this.scene.tweens.add({
                targets: [bg],
                scale: 0.96,
                ease: 'SineInOut',
                duration: 50,
            });
        });
        bg.on('pointerout', () => {
            if (this.sideBet) return;
            this.scene.tweens.add({
                targets: [bg],
                scale: 1,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        return container;
    }

    toggle() {
        if (this.sideBets.length === 0) return;

        this.currentIndex = (this.currentIndex + 1) % (this.sideBets.length + 1);
        this.sideBet = this.currentIndex >= 0 && this.currentIndex < this.sideBets.length;

        const current = this.sideBet ? this.sideBets[this.currentIndex] : null;
        this.onToggle(this.sideBet, current);

        this._updateVisuals();
    }

    _updateVisuals() {
        if (this.sideBet) {
            const sb = this.sideBets[this.currentIndex];
            this.text.setText(`${sb.multiplier}x`);
            this.label.setText(sb.name);
            this.text.setColor(COLORS_LIST.accentHex);
            this.label.setColor(COLORS_LIST.accentHex);
        } else {
            this.text.setText(`$`);
            this.label.setText("SIDE BET");
            this.text.setColor(COLORS_LIST.text_white);
            this.label.setColor(COLORS_LIST.text_white);
        }

        this.scene.tweens.add({
            targets: this.glow,
            alpha: this.sideBet ? 1 : 0,
            ease: 'Sine.InOut',
            duration: 100,
        });
    }

    getContainer() {
        return this.container;
    }

    enable() {
        if (!this.hasSideBet) return;
        this.sideBetBtn.setInteractive({ cursor: "pointer" });
    }

    disable() {
        if (!this.hasSideBet) return;
        this.sideBetBtn.disableInteractive();
    }

    setActive(value) {
        this.sideBet = value;
        if (this.sideBet && this.sideBets.length > 0) {
            this.currentIndex = 0;
        } else {
            this.currentIndex = -1;
        }
        this._updateVisuals();
    }

    getCurrentSideBet() {
        if (!this.sideBet || this.currentIndex < 0) return null;
        return this.sideBets[this.currentIndex] || null;
    }
}
