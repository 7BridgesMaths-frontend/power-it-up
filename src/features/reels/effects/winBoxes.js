export const WIN_BOX = {
    texture: 'winbox',
    anim: 'winbox',
    framePrefix: 'winbox',
    frames: 31,
    frameRate: 30,
    zeroPad: 2,
    symbolFrameWidth: 290,
    strokeColor: 0xffd700,
    strokeWidth: 6,
    radius: 14,
};

function ensureWinBoxAnim(scene) {
    if (scene.anims.exists(WIN_BOX.anim)) return;

    scene.anims.create({
        key: WIN_BOX.anim,
        frames: scene.anims.generateFrameNames(WIN_BOX.texture, {
            prefix: WIN_BOX.framePrefix,
            start: 0,
            end: WIN_BOX.frames - 1,
            zeroPad: WIN_BOX.zeroPad,
        }),
        frameRate: WIN_BOX.frameRate,
        repeat: -1,
    });
}

export function createWinBox(scene, { x, y }, symbolSize) {
    if (scene.textures.exists(WIN_BOX.texture)) {
        ensureWinBoxAnim(scene);
        return scene.add.sprite(x, y, WIN_BOX.texture)
            .setOrigin(0.5)
            .setScale(symbolSize / WIN_BOX.symbolFrameWidth)
            .play(WIN_BOX.anim);
    }

    const half = symbolSize / 2;
    const box = scene.add.graphics({ x, y });
    box.lineStyle(WIN_BOX.strokeWidth, WIN_BOX.strokeColor, 1);
    box.strokeRoundedRect(-half, -half, symbolSize, symbolSize, WIN_BOX.radius);
    return box;
}
