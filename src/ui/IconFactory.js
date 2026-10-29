export default class IconFactory {
    static textureCache = new Set();

    constructor(scene, x, y, svgKey, {
        color = '#ffffff',
        size = 128
    } = {}) {
        /** @type {Phaser.Scene} */
        this.scene = scene;
        this.svgKey = svgKey;
        this.color = color;
        this.size = size;

        this.textureKey = this._getTextureKey();
        this._ensureTexture();

        /** @type {Phaser.GameObjects.Sprite} */
        this.image = scene.add.image(x, y, this.textureKey);
        this.image.setOrigin(0.5);
    }

    _getTextureKey() {
        return `${this.svgKey}_${this.color}_${this.size}`;
    }

    _ensureTexture() {
        if (this.scene.textures.exists(this.textureKey)) return;

        const svg = this.scene.textures
            .get(this.svgKey)
            .getSourceImage();

        const svgWidth = svg.width;
        const svgHeight = svg.height;

        const scale = this.size / svgWidth;

        const targetWidth = Math.round(svgWidth * scale);
        const targetHeight = Math.round(svgHeight * scale);

        const canvas = this.scene.textures
            .createCanvas(this.textureKey, targetWidth, targetHeight);

        const ctx = canvas.getContext();

        ctx.clearRect(0, 0, targetWidth, targetHeight);

        ctx.drawImage(svg, 0, 0, targetWidth, targetHeight);

        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.globalCompositeOperation = 'source-over';

        canvas.refresh();
    }


    // 🎨 cambiar color
    setColor(color) {
        if (this.color === color) return;

        this.color = color;
        this.textureKey = this._getTextureKey();
        this._ensureTexture();
        this.image.setTexture(this.textureKey);
    }

    setIcon(svgKey, { color = this.color, size = this.size } = {}) {
        if (
            this.svgKey === svgKey &&
            this.color === color &&
            this.size === size
        ) return;

        this.svgKey = svgKey;
        this.color = color;
        this.size = size;

        this.textureKey = this._getTextureKey();
        this._ensureTexture();

        this.image.setTexture(this.textureKey);
    }

    // 🧨 destruir
    destroy() {
        this.image.destroy();
    }
}
