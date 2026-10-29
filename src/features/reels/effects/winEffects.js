export const pulseEffect = async (symbols, duration = 600) => {
    await Promise.all(symbols.map(s => s.playPulse(duration)));
};

export const EFFECTS_MAP = {
    "pulse": pulseEffect,
};