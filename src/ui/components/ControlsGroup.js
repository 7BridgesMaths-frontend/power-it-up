import { COLORS_LIST } from "../../constants/COLORS";
import IconFactory from "../IconFactory";

export default class ControlsGroup {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {boolean} */
    hasInfo;

    container;

    constructor({ scene, hasInfo, isMobile = false }) {
        this.scene = scene;
        this.hasInfo = hasInfo;
        this.isMobile = isMobile;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);
        let xOffset = 0;

        const supportsFullscreen = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;

        if (this.hasInfo) {
            xOffset = this.isMobile ? -70 : -47;
            const btnSize = this.isMobile ? 30 : 24;
            const iconSize = this.isMobile ? 12 : 8;
            const bg = this.scene.add.circle(0, 0, btnSize, COLORS_LIST.bg_white)
                .setOrigin(0.5)
                .setName("info_bg")
                .setInteractive({ cursor: "pointer" });

            const icon = new IconFactory(this.scene, 0, 0, 'infoSVG', {
                color: COLORS_LIST.text_black,
                size: iconSize
            });

            const label = this.scene.add.text(0, 35, "INFO", {
                fontFamily: "Inter",
                fontSize: 12,
                fill: COLORS_LIST.text_white,
                align: "center",
                lineSpacing: -4,
            }).setOrigin(0.5);

            container.add([bg, icon.image, label]);

            bg.on('pointerup', () => {
                // TODO: open info
            });

            bg.on('pointerover', () => {
                this.scene.audioManager.playHover()
                this.scene.tweens.add({
                    targets: [bg, icon.image],
                    scale: 0.96,
                    ease: 'SineInOut',
                    duration: 50,
                });
            });

            bg.on('pointerout', () => {
                this.scene.tweens.add({
                    targets: [bg, icon.image],
                    scale: 1,
                    ease: 'SineInOut',
                    duration: 50,
                });
            });
        }

        const btnSize = this.isMobile ? 50 : 24;
        const iconSize = this.isMobile ? 44 : 20;

        const fullScreenBG = this.scene.add.circle(0, 0, btnSize, supportsFullscreen ? COLORS_LIST.bg_black : 0x666666)
            .setOrigin(0.5)
            .setName("fullscreen_bg")
            .setInteractive({ cursor: supportsFullscreen ? "pointer" : "default" });

        const fullScreenIcon = new IconFactory(this.scene, 0, 0, 'fullScreenSVG_inactive', {
            color: supportsFullscreen ? COLORS_LIST.text_white : 0x999999,
            size: iconSize
        });

        if (supportsFullscreen) {
            fullScreenBG.on('pointerup', () => {
                this.toggleFullscreen(fullScreenIcon);
            });

            fullScreenBG.on('pointerover', () => {
                this.scene.audioManager.playHover()
                this.scene.tweens.add({
                    targets: [fullScreenBG, fullScreenIcon.image],
                    scale: 0.96,
                    ease: 'SineInOut',
                    duration: 50,
                });
            });

            fullScreenBG.on('pointerout', () => {
                this.scene.tweens.add({
                    targets: [fullScreenBG, fullScreenIcon.image],
                    scale: 1,
                    ease: 'SineInOut',
                    duration: 50,
                });
            });
        }

        const fullScreenContainer = this.scene.add.container(xOffset, 0);
        fullScreenContainer.add([fullScreenBG, fullScreenIcon.image]);

        // Sound button
        const soundBG = this.scene.add.circle(0, 0, btnSize, COLORS_LIST.bg_black)
            .setOrigin(0.5)
            .setName("sound_bg")
            .setInteractive({ cursor: "pointer" });

        const soundIcon = new IconFactory(this.scene, 0, 0, 'soundSVG', {
            color: COLORS_LIST.text_white,
            size: iconSize
        });

        soundBG.on('pointerup', () => {
            this.toggleSound(soundIcon);
        });

        soundBG.on('pointerover', () => {
            this.scene.audioManager.playHover()
            this.scene.tweens.add({
                targets: [soundBG, soundIcon.image],
                scale: 0.96,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        soundBG.on('pointerout', () => {
            this.scene.tweens.add({
                targets: [soundBG, soundIcon.image],
                scale: 1,
                ease: 'SineInOut',
                duration: 50,
            });
        });

        let soundContainer;
        if (this.isMobile) {
            const horizontalGap = btnSize * 2 + 30;
            soundContainer = this.scene.add.container(xOffset + horizontalGap, 0);
        } else {
            soundContainer = this.scene.add.container(xOffset, 55);
        }
        soundContainer.add([soundBG, soundIcon.image]);

        container.add(fullScreenContainer);
        container.add(soundContainer);

        return container;
    }

    toggleFullscreen(icon) {
        if (this.scene.scale.isFullscreen) {
            icon.setIcon("fullScreenSVG_inactive");
            this.scene.scale.stopFullscreen();
        } else {
            icon.setIcon("fullScreenSVG_active");
            this.scene.scale.startFullscreen();
        }
    }

    toggleSound(icon) {
        const audio = this.scene.audioManager;
        if (!audio) return;

        // Check if anything is muted
        const isMuted = !audio.isMusicEnabled() || !audio.isSfxEnabled();
        const shouldMute = !isMuted;

        audio.setMute(shouldMute);
        icon.setIcon(shouldMute ? "muteSoundSVG" : "soundSVG");
    }

    getContainer() {
        return this.container;
    }
}
