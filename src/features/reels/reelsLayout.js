export function resolveReelsLayout(model, responsiveConfig = {}) {
    return computeReelsLayout({
        grid: model.getGrid(),
        reelsY: model.getReelsY() ?? [],
        symbolSize: responsiveConfig.symbolSize ?? model.getSymbolSize(),
        gapBetweenReels: responsiveConfig.gapBetweenReels ?? model.getGapBetweenReels(),
        gapBetweenRows: responsiveConfig.gapBetweenRows ?? model.getGapBetweenRows(),
    });
}

export function computeReelsLayout({ grid, reelsY = [], symbolSize, gapBetweenReels = 0, gapBetweenRows = 0 }) {
    const reelSpacing = symbolSize + gapBetweenReels;
    const rowSpacing = symbolSize + gapBetweenRows;

    const reels = grid.map((rows, i) => ({
        x: i * reelSpacing,
        y: reelsY[i] ?? 0,
        width: symbolSize,
        height: rows * symbolSize + Math.max(rows - 1, 0) * gapBetweenRows,
    }));

    return { symbolSize, gapBetweenReels, gapBetweenRows, reelSpacing, rowSpacing, reels };
}

export function getCellCenter(layout, reel, row) {
    const { x, y } = layout.reels[reel];
    return {
        x: x + layout.symbolSize / 2,
        y: y + row * layout.rowSpacing + layout.symbolSize / 2,
    };
}

export function getMaskRects(layout, { x, y, scaleX, scaleY }, cellBounds) {
    const left = Math.min(0, cellBounds?.left ?? 0);
    const right = Math.max(layout.symbolSize, cellBounds?.right ?? layout.symbolSize);

    return layout.reels.map(reel => ({
        x: x + (reel.x + left) * scaleX,
        y: y + reel.y * scaleY,
        width: (right - left) * scaleX,
        height: reel.height * scaleY,
    }));
}

export function getSymbolCellBounds(view) {
    if (!view) return undefined;
    const left = view.x - view.displayWidth * view.originX;
    return { left, right: left + view.displayWidth };
}
