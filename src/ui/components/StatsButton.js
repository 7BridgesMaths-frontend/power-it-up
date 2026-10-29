import { COLORS_LIST } from "../../constants/COLORS";
import IconFactory from "../IconFactory";

export default class StatsButton {
    /** @type {Phaser.Scene} */
    scene;
    container;
    statsIcon;

    constructor({ scene, isMobile = false }) {
        this.scene = scene;
        this.isMobile = isMobile;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);

        const btnSize = this.isMobile ? 50 : 24;
        const iconSize = this.isMobile ? 50 : 26;

        const statsButton = this.scene.add.circle(0, 0, btnSize, COLORS_LIST.bg_black)
            .setInteractive({ cursor: "pointer" });

        this.statsIcon = new IconFactory(this.scene, 0, 0, 'configSVG', {
            color: COLORS_LIST.text_white,
            size: iconSize
        });

        statsButton.on('pointerup', () => {
            this.toggle();
        });
        
        statsButton.on('pointerover', () => {
            this.scene.audioManager.playHover()
        });

        this.statsIcon.image.setInteractive({ cursor: "pointer" });
        this.statsIcon.image.on('pointerup', () => {
            this.toggle();
        });

        container.add([statsButton, this.statsIcon.image]);
        return container;
    }

    toggle() {
        const statsPanel = this.scene.registry.get('statsPanel');
        if (!statsPanel) return;

        const panelEl = statsPanel.node?.querySelector('#stats-panel');
        if (!panelEl) return;

        const wasCollapsed = panelEl.classList.contains('collapsed');
        panelEl.classList.toggle('collapsed');
        const isCollapsed = !wasCollapsed;

        if (isCollapsed) {
            const offScreenY = this.isMobile ? -700 : -1000;
            statsPanel.setPosition(0, offScreenY);
            statsPanel.node.style.setProperty('pointer-events', 'none', 'important');
        } else {
            statsPanel.setPosition(0, 0);
            statsPanel.node.style.setProperty('pointer-events', 'auto', 'important');
        }

        this.statsIcon.setColor(
            isCollapsed
                ? COLORS_LIST.text_white
                : COLORS_LIST.accentHex
        );
    }

    getContainer() {
        return this.container;
    }
}
