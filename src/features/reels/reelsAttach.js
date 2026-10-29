import { ResponsiveManager } from "../../core";

const FRAME_DEFAULTS = { offsetY: -12, scaleY: 0.93 };

export function getAttachConfig(scene, key, defaults = {}) {
    const config = { ...defaults, ...(ResponsiveManager.getForScene(scene)?.get(key) || {}) };
    return {
        ...config,
        offsetX: config.offsetX ?? 0,
        offsetY: config.offsetY ?? 0,
        scaleX: config.scaleX ?? config.scale ?? 1,
        scaleY: config.scaleY ?? config.scale ?? 1,
    };
}

export function attachToReels(scene, object, key, reels, defaults) {
    const config = getAttachConfig(scene, key, defaults);
    const scaleX = reels.scaleX ?? reels.scale ?? 1;
    const scaleY = reels.scaleY ?? reels.scale ?? 1;
    object
        .setPosition((reels.x ?? 0) + config.offsetX * scaleX, (reels.y ?? 0) + config.offsetY * scaleY)
        .setScale(config.scaleX * scaleX, config.scaleY * scaleY);
}

export function isBackgroundMasked(scene) {
    return getAttachConfig(scene, 'reelsBackground').masked ?? true;
}

export function layoutBackground(scene, background, reels) {
    if (!isBackgroundMasked(scene)) {
        attachToReels(scene, background, 'reelsBackground', reels);
        return;
    }
    const { offsetX, offsetY, scaleX, scaleY } = getAttachConfig(scene, 'reelsBackground');
    background.setPosition(offsetX, offsetY).setScale(scaleX, scaleY);
}

export function layoutFrame(scene, frame, reels) {
    attachToReels(scene, frame, 'reelsFrame', reels, FRAME_DEFAULTS);
}
