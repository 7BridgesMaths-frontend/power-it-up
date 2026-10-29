export const generateLineColors = (count) => {
    const BASE_COLORS = [
        0xFFD700, // gold
        0xFF4444, // red
        0x44FF44, // green
        0x4444FF, // blue
        0xFF44FF, // purple
        0x44FFFF, // cyan
        0xFF8C00, // orange
        0xFF69B4, // pink
    ];

    if (count <= BASE_COLORS.length) {
        return BASE_COLORS.slice(0, count);
    }

    const colors = [...BASE_COLORS];
    const extra = count - BASE_COLORS.length;

    for (let i = 0; i < extra; i++) {
        const hue = (i / extra) * 360;
        colors.push(_hslToHex(hue, 100, 50));
    }

    return colors;
}

function _hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);
    return (r << 16) | (g << 8) | b;
}