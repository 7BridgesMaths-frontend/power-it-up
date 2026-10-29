import mobileConfig from '../config/mobile.config';
import desktopConfig from '../config/desktop.config';

const SCENE_KEY = '__responsiveManager';

export class ResponsiveManager {
    scene;
    isMobile;

    constructor(scene) {
        this.scene = scene;
        this.isMobile = window.innerHeight > window.innerWidth;
    }

    /**
     * @param {string} key - e.g. 'reels', 'balanceText'
     * @returns {object|undefined}
     */
    get(key) {
        if (this.isMobile) {
            let value = this.getValueByPath(mobileConfig, key);
            if (value !== undefined) return value;
            return this.getValueByPath(desktopConfig, key);
        }

        return this.getValueByPath(desktopConfig, key);
    }

    getValueByPath(obj, path) {
        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return undefined;
            }
        }

        return current;
    }

    isMobileView() {
        return this.isMobile;
    }

    isDesktopView() {
        return !this.isMobile;
    }

    static setForScene(scene, manager) {
        scene.data.set(SCENE_KEY, manager);
    }

    static getForScene(scene) {
        return scene.data.get(SCENE_KEY);
    }
}

Phaser.GameObjects.GameObject.prototype.applyResponsive = function(key) {
    const manager = ResponsiveManager.getForScene(this.scene);

    if (!manager) {
        console.warn(`ResponsiveManager not found for scene "${this.scene.constructor.name}"`);
        return this;
    }

    const config = manager.get(key);

    if (config === undefined) {
        console.warn(`Responsive config key "${key}" not found`);
        return this;
    }

    if (config.x !== undefined) this.x = config.x;
    if (config.y !== undefined) this.y = config.y;
    if (config.scale !== undefined) this.setScale(config.scale);
    if (config.scaleX !== undefined || config.scaleY !== undefined) {
        const currentScale = this.scale || 1;
        const newScaleX = config.scaleX !== undefined ? config.scaleX : currentScale;
        const newScaleY = config.scaleY !== undefined ? config.scaleY : currentScale;
        this.setScale(newScaleX, newScaleY);
    }
    if (config.alpha !== undefined) this.setAlpha(config.alpha);
    if (config.visible !== undefined) this.setVisible(config.visible);
    if (config.angle !== undefined) this.setAngle(config.angle);
    if (config.origin !== undefined) this.setOrigin(config.origin);
    if (config.rotation !== undefined) this.setRotation(config.rotation);

    return this;
};

export default ResponsiveManager;
