import { COLORS_LIST } from "../../constants/COLORS";

export default class ForcedPlaySelector {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {Function} */
    onGameTypeChange;
    /** @type {Object} */
    options;
    /** @type {string} */
    gameType;

    container;
    forcedPlayForm;

    constructor({ scene, onGameTypeChange, options, isMobile = false }) {
        this.scene = scene;
        this.onGameTypeChange = onGameTypeChange;
        this.options = options;
        this.isMobile = isMobile;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);

        this.forcedPlayForm = this.scene.add.dom(0, 0).createFromCache('force_play_form');
        this.forcedPlayForm.addListener('change');
        this.forcedPlayForm.on('change', (event) => {
            this.onGameTypeChange(event.target.value);
        });
        this.forcedPlayForm.setOrigin(0);

        const select = document.getElementById("typeGame");
        if (this.isMobile) {
            select.classList.add('mobile');
        }

        Object.entries(this.options).forEach(([key, config]) => {
            if (!config.visibleInForcedPlay) return;
            const option = document.createElement("option");
            option.value = config.spinType ?? "missing-forced";
            if (!config.spinType) {
                console.warn("Missing forced, input: ", config.label);
            }
            option.textContent = config.label;
            select.appendChild(option);
        });

        if (!this.isMobile) {
            const label = this.scene.add.text(230 / 2, 70, "FORCE PLAY", {
                fontFamily: "Inter",
                fontSize: 18,
                fill: COLORS_LIST.text_white,
                align: "center",
                lineSpacing: -4,
            }).setOrigin(0.5);
            container.add([this.forcedPlayForm, label]);
        } else {
            container.add(this.forcedPlayForm);
        }

        return container;
    }

    reset() {
        const select = document.getElementById("typeGame");
        select.selectedIndex = 0;
    }

    disable(){
        const select = document.getElementById("typeGame");
        select.disabled = true;
    }

    enable(){
        const select = document.getElementById("typeGame");
        select.disabled = false;
    }

    getContainer() {
        return this.container;
    }

    setGameType(value) {
        this.gameType = value;
    }
}
