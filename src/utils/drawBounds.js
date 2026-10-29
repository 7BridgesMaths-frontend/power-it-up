export const drawBounds = (scene, container, color = 0xff0000) => {
  const g = scene.add.graphics();

  scene.events.on('update', () => {
    g.clear();
    g.lineStyle(2, color, 1);

    const bounds = container.getBounds();
    g.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  });

  return g;
}