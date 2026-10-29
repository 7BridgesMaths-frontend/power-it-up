export default class DevTool {
    constructor({ scene, x = 1880, y = 700, nameFromPreload = 'dev-panel', visible = true }) {
        /** @type {Phaser.Scene} */
        this.scene = scene;
        this.isGamePaused = false

        if (!visible) return;

        this.dom = this.scene.add.dom(x, y)
            .createFromCache(nameFromPreload)
            .setOrigin(0);

        this.dom.addListener("click");
        this.dom.addListener("input");
        this.dom.addListener("change");

        this.dom.on("click", (ev) => this._handleClick(ev));
        this.dom.addListener("change");
        this.dom.on("change", (ev) => this._handleInput(ev));

        this.setInitialValues();
    }

    setContainers(containers){
        this.containersToShowBorders = containers
    }

    register(input) {
        if (!this.containersToShowBorders) {
            this.containersToShowBorders = [];
        }

        const items = Array.isArray(input) ? input : [input];

        items.forEach(container => {
            this.containersToShowBorders.push(container);
        });
    }

    executeFunction(callback) {
        this._executeCallback = callback;
    }

    setInitialValues() {
        const node = this.dom.node;

        node.querySelector("#show-borders").checked = false;
        node.querySelector("#btn-pause").checked = false;
    }

    _handleClick(ev) {
        const id = ev.target.id;

        switch (id) {
            case "btn-function":
                this._executeCallback?.();
                break;
        }
    }

    _handleInput(ev) {
        const id = ev.target.id;
        const value = ev.target.type === "checkbox"
            ? ev.target.checked
            : ev.target.value;

        switch (id) {
            case "show-borders":
                    if (value) {
                        this.drawBounds();
                    } else {
                        this.clearBounds();
                    }
                break;
            case "btn-pause":
                this._togglePause();
                break;
        }
    }

    _togglePause(){
        this.isGamePaused = !this.isGamePaused
        
        if (this.isGamePaused){
            this.scene.tweens.setGlobalTimeScale(0)
        } else {
            this.scene.tweens.setGlobalTimeScale(1)
        }

        console.log(
            `%c${this.isGamePaused ? "⏸ GAME PAUSED" : "▶ GAME RESUMED"}`,
            `background: #222; 
            color: ${this.isGamePaused ? "#ffcc00" : "#00ff88"}; 
            padding: 6px 12px; 
            border-radius: 4px; 
            font-weight: bold;`
        );
    }

    drawBounds(color = 0xff0000) {
        this._boundsGraphics = this.scene.add.graphics().setDepth(9999);

        this._boundsUpdate = () => {
            this._boundsGraphics.clear();
            this._boundsGraphics.lineStyle(2, color, 1);

            this.containersToShowBorders.forEach((element) => {
                if (!element || !element.active) return;

                const bounds = element.getBounds();
                this._boundsGraphics.strokeRect(
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height
                );
            });
        };

        this.scene.events.on("update", this._boundsUpdate);
    }

    clearBounds() {
        if (this._boundsUpdate) {
            this.scene.events.off("update", this._boundsUpdate);
            this._boundsUpdate = null;
        }

        if (this._boundsGraphics) {
            this._boundsGraphics.clear();
            this._boundsGraphics.destroy();
            this._boundsGraphics = null;
        }
    }
}