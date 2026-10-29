export default class DebugPanel {

    constructor({scene, x=108, y=246, target, nameFromPreload = 'debug-panel', visible = true, callBack}) {
        this.scene = scene;
        this.target = target;

        if (!visible) return;
        this.dom = this.scene.add.dom(x, y).createFromCache(nameFromPreload).setOrigin(0);

        this.dom.addListener("input");
        this.dom.addListener("change");

        this.dom.on("input", (ev) => this.update(ev));
        this.dom.on("change", (ev) => this.update(ev));
        this.dom.getChildByID("debug-panel-button").addEventListener('click', (ev) => {
            if (callBack){
                callBack()
            }
        });

        this.setInitialValues();
    }

    setInitialValues() {

        const set = (id, value) => {
            const input = this.dom.getChildByID(id);
            const label = this.dom.getChildByID(id + "_value");

            if (!input) return;

            if (input.type == "checkbox") {
                input.checked = value;
            } else {
                input.value = value;
            }

            if (label) label.innerText = value;
        };

        set("posX", this.target.x ?? 0);
        set("posY", this.target.y ?? 0);
        set("scaleX", this.target.scaleX ?? 1);
        set("scaleY", this.target.scaleY ?? 1);
        set("visible", this.target.visible ?? true);
        set("depth", this.target.depth ?? 0);
    }

    update(ev) {
        const input = ev.target;
        const id = input.id;

        const label = this.dom.getChildByID(id + "_value");
        if (label) {
            label.innerText = input.type == "checkbox"
                ? input.checked
                : input.value;
        }

        switch (id) {
            case "posX":
                this.target.x = Number(input.value);
                break;

            case "posY":
                this.target.y = Number(input.value);
                break;

            case "scaleX":
                this.target.scaleX = Number(input.value);
                break;

            case "scaleY":
                this.target.scaleY = Number(input.value);
                break;

            case "visible":
                this.target.visible = input.checked;
                break;

            case "depth":
                this.target.depth = Number(input.value);
                break;
        }
    }
}
