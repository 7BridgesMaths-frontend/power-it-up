export const WIN_LINE = {
    width: 10,
    coreWidth: 3.5,
    coreWhiteness: 0.8,
    overhang: 0.5,
};

export function getWinLinePoints(positions, getCellCenter, cellWidth, overhang = WIN_LINE.overhang) {
    const points = positions.map((row, reel) => getCellCenter(reel, row));
    if (points.length === 0) return points;

    const first = points[0];
    const last = points[points.length - 1];

    return [
        { x: first.x - cellWidth * overhang, y: first.y },
        ...points,
        { x: last.x + cellWidth * overhang, y: last.y },
    ];
}

export function getStrokePolygon(points, width) {
    const half = width / 2;
    const normals = points.slice(1).map((p, i) => {
        const dx = p.x - points[i].x;
        const dy = p.y - points[i].y;
        const length = Math.hypot(dx, dy) || 1;
        return { x: -dy / length, y: dx / length };
    });

    const offsets = points.map((_, i) => {
        const before = normals[i - 1] ?? normals[i];
        const after = normals[i] ?? normals[i - 1];
        const mx = before.x + after.x;
        const my = before.y + after.y;
        const length = Math.hypot(mx, my) || 1;
        const miter = { x: mx / length, y: my / length };
        const scale = half / Math.max(miter.x * after.x + miter.y * after.y, 0.25);
        return { x: miter.x * scale, y: miter.y * scale };
    });

    const left = points.map((p, i) => ({ x: p.x + offsets[i].x, y: p.y + offsets[i].y }));
    const right = points.map((p, i) => ({ x: p.x - offsets[i].x, y: p.y - offsets[i].y }));
    return [...left, ...right.reverse()];
}

export function trimEnds(points, amount) {
    if (points.length < 2) return points;

    const moveTowards = (from, to) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy) || 1;
        return { x: from.x + dx / length * amount, y: from.y + dy / length * amount };
    };

    const trimmed = points.slice();
    trimmed[0] = moveTowards(points[0], points[1]);
    trimmed[trimmed.length - 1] = moveTowards(points[points.length - 1], points[points.length - 2]);
    return trimmed;
}

export function mixWithWhite(color, amount) {
    const channel = shift => {
        const value = (color >> shift) & 0xff;
        return Math.round(value + (255 - value) * amount) << shift;
    };
    return channel(16) | channel(8) | channel(0);
}

export function drawWinLine(scene, container, points, color, { scale = 1, config = WIN_LINE } = {}) {
    const { key, x, y } = getWinLineTexture(scene, points, color, scale, config);
    const image = scene.add.image(x, y, key).setOrigin(0);
    container.add(image);
    return image;
}

function getWinLineTexture(scene, points, color, scale, config) {
    const width = config.width * scale;
    const coreWidth = config.coreWidth * scale;
    const padding = Math.ceil(width);

    const outline = getStrokePolygon(points, width);
    const minX = Math.floor(Math.min(...outline.map(p => p.x))) - padding;
    const minY = Math.floor(Math.min(...outline.map(p => p.y))) - padding;
    const maxX = Math.ceil(Math.max(...outline.map(p => p.x))) + padding;
    const maxY = Math.ceil(Math.max(...outline.map(p => p.y))) + padding;

    const key = `winline_${color.toString(16)}_${hashPoints(points, width, coreWidth)}`;
    if (!scene.textures.exists(key)) {
        const local = list => list.map(p => ({ x: p.x - minX, y: p.y - minY }));
        const graphics = scene.make.graphics({ add: false });

        graphics.fillStyle(color, 1);
        graphics.fillPoints(local(outline), true);

        graphics.fillStyle(mixWithWhite(color, config.coreWhiteness), 1);
        graphics.fillPoints(local(getStrokePolygon(trimEnds(points, (width - coreWidth) / 2), coreWidth)), true);

        graphics.generateTexture(key, maxX - minX, maxY - minY);
        graphics.destroy();
    }

    return { key, x: minX, y: minY };
}

function hashPoints(points, ...values) {
    const text = [...points.flatMap(p => [Math.round(p.x), Math.round(p.y)]), ...values].join(',');
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
    return (hash >>> 0).toString(36);
}
