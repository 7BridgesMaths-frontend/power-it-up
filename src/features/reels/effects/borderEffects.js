export const borderEffect = async (symbols, duration = 600, delay) => {
    symbols.forEach(s => s.showBorder());
    await delay(duration);
    symbols.forEach(s => s.stopBorder());
}