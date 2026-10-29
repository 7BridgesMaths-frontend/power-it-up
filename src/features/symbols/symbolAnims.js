
export const SYMBOL_ANIMS = {
    enabled: false,
    symbols: {
        1: { fps: 20, scale: 1, offsetX: 0, offsetY: -0 },
        2: { fps: 20, scale: 1, offsetX: 0, offsetY: 0 },
        3: { fps: 20, scale: 1, offsetX: 0, offsetY: 0 },
        4: { fps: 20, scale: 1, offsetX: 0, offsetY: 0 },
    },

    path: 'assets/images/symbols/anims/',
    fps: 20,
    onLand: 'once',
    onWin: 'loop',
    stopOnSpin: 'win',
    holdLastFrame: true,
    debug: false,
};

const MODES = ['once', 'loop', 'none'];
const STOP_ON_SPIN = ['win', 'all', 'none'];

const DEFAULTS = {
    enabled: true,
    path: 'assets/images/symbols/anims/',
    fps: 20,
    onLand: 'once',
    onWin: 'loop',
    stopOnSpin: 'win',
    holdLastFrame: true,
    debug: false,
};

const settings = { ...DEFAULTS, ...SYMBOL_ANIMS };
const symbols = SYMBOL_ANIMS.symbols ?? {};

const warned = new Set();

function warnOnce(id, msg) {
    if (warned.has(id)) return;
    warned.add(id);
    console.warn(`[symbolAnims] sym_${id}: ${msg}`);
}

export function getSymbolAnimKey(id) {
    return `sym_${id}_anim`;
}

export function getSymbolAnim(id) {
    if (!settings.enabled) return null;
    const cfg = symbols[id];
    if (!cfg) return null;

    return {
        key: getSymbolAnimKey(id),
        file: cfg.file ?? `sym_${id}_atlas`,
        prefix: cfg.prefix ?? '',
        fps: cfg.fps ?? settings.fps,
        scale: cfg.scale ?? 1,
        offsetX: (cfg.offsetX ?? 0) / 100,
        offsetY: (cfg.offsetY ?? 0) / 100,
        onLand: cfg.onLand,
        onWin: cfg.onWin,
        holdLastFrame: cfg.holdLastFrame,
    };
}

export function getSymbolAnimMode(id, event) {
    const cfg = getSymbolAnim(id);
    if (!cfg) return 'none';

    const mode = cfg[event] ?? settings[event];
    if (!MODES.includes(mode)) {
        warnOnce(id, `"${mode}" no es válido para ${event}. Opciones: ${MODES.join(', ')}`);
        return DEFAULTS[event];
    }
    return mode;
}

export function getStopOnSpin() {
    return STOP_ON_SPIN.includes(settings.stopOnSpin) ? settings.stopOnSpin : DEFAULTS.stopOnSpin;
}

export function getHoldLastFrame(id) {
    return !!(getSymbolAnim(id)?.holdLastFrame ?? settings.holdLastFrame);
}

export function isSymbolAnimDebug() {
    return !!settings.debug;
}

export function loadSymbolAnims(scene) {
    if (!settings.enabled) return;
    for (const id of Object.keys(symbols)) {
        const { key, file } = getSymbolAnim(id);
        scene.load.atlas(key, `${settings.path}${file}.png`, `${settings.path}${file}.json`);
    }
}

function getFrames(scene, key, prefix) {
    const number = name => parseInt(name.match(/(\d+)(?!.*\d)/)?.[1] ?? '0', 10);

    return scene.textures.get(key).getFrameNames()
        .filter(name => name.startsWith(prefix))
        .sort((a, b) => number(a) - number(b))
        .map(frame => ({ key, frame }));
}

export function ensureSymbolAnim(scene, id) {
    const cfg = getSymbolAnim(id);
    if (!cfg) return false;
    if (scene.anims.exists(cfg.key)) return true;

    if (!scene.textures.exists(cfg.key)) {
        warnOnce(id, `no se cargó ${settings.path}${cfg.file}.png / .json`);
        return false;
    }

    const frames = getFrames(scene, cfg.key, cfg.prefix);
    if (frames.length === 0) {
        warnOnce(id, `el atlas no tiene frames que empiecen con "${cfg.prefix}"`);
        return false;
    }

    scene.anims.create({ key: cfg.key, frames, frameRate: cfg.fps, repeat: -1 });

    if (isSymbolAnimDebug()) {
        console.info(`[symbolAnims] sym_${id}: ${frames.length} frames a ${cfg.fps} fps | onLand: ${getSymbolAnimMode(id, 'onLand')} | onWin: ${getSymbolAnimMode(id, 'onWin')}`);
    }
    return true;
}

export function getSymbolAnimFirstFrame(scene, id) {
    return scene.anims.get(getSymbolAnimKey(id))?.frames?.[0]?.frame ?? null;
}
