export default class DraggableHelper {
    constructor(scene) {
        this.scene = scene;
        this.enabled = false;
        this.overlays = [];
        this._registerMakeDraggable();
    }

    _registerMakeDraggable() {
        const helper = this;
        this.scene.makeDraggable = function(target, name) {
            helper._addItem(target, name || 'item');
        };
        if (this.scene.scene) {
            this.scene.scene.makeDraggable = this.scene.makeDraggable;
        }
    }

    _addItem(container, name) {
        if (!container) return;
        if (this.enabled) {
            this._createOverlay(container, name);
        }
        this._registeredItems = this._registeredItems || [];
        this._registeredItems.push({ container, name });
    }

    enable() {
        if (this.enabled) return;
        this.enabled = true;

        if (!this.scene.controls_bar) {
            console.warn('controls_bar not found, retrying...');
            this.scene.time.delayedCall(500, () => this.enable());
            return;
        }

        console.log('DraggableHelper enabled - drag yellow labels to move items');

        if (this._registeredItems) {
            this._registeredItems.forEach(({ container, name }) => {
                this._createOverlay(container, name);
            });
        }
    }

    _createOverlay(container, name) {
        const bounds = container.getBounds?.() || { width: 80, height: 80 };
        const w = Math.max(bounds.width, 80);
        const h = Math.max(bounds.height, 80);

        const overlay = this.scene.add.rectangle(0, 0, w, h, 0xffff00, 0.15);
        overlay.setOrigin(0, 0);
        overlay.setDepth(9997);

        overlay.setPosition(container.x, container.y);
        overlay.setInteractive({ draggable: true });

        const label = this.scene.add.text(container.x + w / 2, container.y - 20, name, {
            fontFamily: 'Inter',
            fontSize: 14,
            fill: '#000000',
            backgroundColor: '#ffff00'
        }).setOrigin(0.5).setDepth(9999);

        overlay.on('drag', (pointer, dragX, dragY) => {
            container.x = dragX;
            container.y = dragY;
            overlay.x = dragX;
            overlay.y = dragY;
            label.x = dragX + w / 2;
            label.y = dragY - 20;
        });

        overlay.on('dragend', () => {
            console.log(`${name}: { x: ${Math.round(container.x)}, y: ${Math.round(container.y)} }`);
        });

        this.overlays.push({ overlay, label, container, name });
    }

    disable() {
        if (!this.enabled) return;
        this.enabled = false;
        this.overlays.forEach(o => {
            o.overlay.destroy();
            o.label.destroy();
        });
        this.overlays = [];
        console.log('DraggableHelper disabled');
    }

    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
}
