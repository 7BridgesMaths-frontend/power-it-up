import ApiService from "../services/ApiService";
import { config } from "../config/config";
import { DebugPanel } from "../utils";
import { loadSymbolAnims } from "../features/symbols/symbolAnims";

const FINAL_MESSAGE = "FINAL MESSAGE"

const COLORS = {
    track: 0x222222, // Nota: Este valor tiene que estar en hexadecimales. 0x...
    progress: 0x28E11B,
    status: '#28E11B',
}

export default class LoadingScreen extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScreen' });
        this._currentProgress = 0;
        this._assetsLoaded = false;
        this._loginDone = false;
        this.gameConfig = config;
        this.api = new ApiService();

        window.addEventListener('beforeunload', () => {
            this.api.logout();
        });
    }

    preload() {
        if (this.gameConfig.loadingScreen.test) {
            console.log(
                `%c▶ DEV MODE ACTIVE: LOADING SCREEN DISABLED`,
                `background: #222; 
                color: #ffcc00; 
                padding: 6px 12px; 
                border-radius: 4px; 
                font-weight: bold;`
            );
            this._buildUI();
            this._runTestMode();
            return;
        }

        if (this.gameConfig.loadingScreen.show) {
            this._buildUI();
            this._startLogin();
        }

        this.loadCSS()
        this.loadPlays()
        this.loadGraphics()
        this.loadIcons()
        this.loadDomElements()
        this.loadSounds()

        this.load.bitmapFont(
            'slotFont',
            'assets/images/ui/fonts/slotFont.png',
            'assets/images/ui/fonts/slotFont.xml'
        );

        this.load.on('progress', value => {
            if (!this.gameConfig.loadingScreen.show) return;
            this.setProgress(value * 0.7, 'Loading resources...');
        });

        this.load.on('complete', () => {
            this._assetsLoaded = true;
            this._checkReady();
        });
    }

    // ==============================
    // Asset loaders
    // ==============================

    loadCSS() {
    }

    // ==============================
    // PLAYS
    // ==============================

    loadPlays() {
        this.load.json('singlePlay', 'assets/data/single_play.json');
    }

    // ==============================
    // GRAPHICS
    // ==============================
    
    loadGraphics() {
        this.loadSymbols()
        this.loadUI()
        this.loadBackgrounds()
        this.loadReels()
        this.loadFX()
    }

    loadSymbols() {
        this.load.atlas(
            'symbols',
            'assets/images/symbols/symbols.png',
            'assets/images/symbols/symbols.json',
            Phaser.Loader.TEXTURE_ATLAS_JSON_HASH
        );

        loadSymbolAnims(this);
    }

    loadUI() {
        this.load.atlas(
            'ui',
            'assets/images/ui/screens/ui-buttons1.png',
            'assets/images/ui/screens/ui-buttons1.json',
            Phaser.Loader.TEXTURE_ATLAS_JSON_HASH
        );
    }

    loadBackgrounds() {
        if (this.gameConfig.background?.key) {
            this.load.image(this.gameConfig.background.key, this.gameConfig.background.path);
        }
        this.load.image('bg_fs', 'assets/images/ui/backgrounds/fs-bg.png');
    }

    loadReels(){
        this.load.image('reelsBG', 'assets/images/ui/reels/bg.png');
        this.load.image('reelsFrame', 'assets/images/ui/reels/frame.png');
    }

    loadFX() {
        this.load.image('spark', 'assets/images/ui/particles/spark.png');
        this.load.image('flare', 'assets/images/ui/particles/flare.png');
        //this.load.image('luz1', 'assets/images/ui/particles/luz1.png');
    }

    // ==============================
    // DOM
    // ==============================

    loadDomElements() {
        this.load.html('force_play_form', 'assets/dom/force-play.html');
        this.load.html('debug-panel', 'assets/dom/debug-panel.html');
        this.load.html('dev-panel', 'assets/dom/dev-panel.html');
        this.load.html('stats-panel', 'assets/dom/stats-panel.html');
    }

    // ==============================
    // AUDIO
    // ==============================

    loadSounds() {
        this.load.audio('clickDown', 'assets/sound/clickDown.mp3');
        this.load.audio('bonusWon', 'assets/sound/bonusWon.mp3');
        this.load.audio('bonusEnd', 'assets/sound/bonusEnd.mp3');
        this.load.audio('won', 'assets/sound/won.mp3');
        this.load.audio('gameBGM', 'assets/sound/bgm.mp3');
        this.load.audio('hover', 'assets/sound/hover.mp3');
    }

    // ==============================
    // ICONS
    // ==============================

    loadIcons() {
        this.load.svg('spinSVG', 'assets/images/ui/control_icons/spin-ui.svg');
        this.load.svg('stopSVG', 'assets/images/ui/control_icons/stop-ui.svg');
        this.load.svg('closeSVG', 'assets/images/ui/control_icons/close-ui.svg');
        this.load.svg('infoSVG', 'assets/images/ui/control_icons/info-ui.svg');
        this.load.svg('fullScreenSVG_inactive', 'assets/images/ui/control_icons/full-screen-ui.svg');
        this.load.svg('fullScreenSVG_active', 'assets/images/ui/control_icons/full-screen-out-ui.svg');
        this.load.svg('soundSVG', 'assets/images/ui/control_icons/sound-ui.svg');
        this.load.svg('muteSoundSVG', 'assets/images/ui/control_icons/mute-sound-ui.svg');
        this.load.svg('autoPlaySVG', 'assets/images/ui/control_icons/autoplay-ui.svg');
        this.load.svg('turboPlaySVG', 'assets/images/ui/control_icons/turbo-play-ui.svg');
        this.load.svg('configSVG', 'assets/images/ui/control_icons/config-ui.svg');
    }
    
    create() {}

    // ==============================
    // Test mode
    // ==============================

    _runTestMode() {
        const steps = [
            { value: 0.2,  label: 'Loading resources...' },
            { value: 0.5,  label: 'Loading resources...' },
            { value: 0.7,  label: 'Authenticating...' },
            { value: 0.8,  label: 'Authenticating...' },
            { value: 1.0,  label: `${FINAL_MESSAGE}...` },
        ];

        const run = () => {
            this._currentProgress = 0;
            this._drawFill(0);

            let delay = 0;
            for (const step of steps) {
                this.time.delayedCall(delay, () => {
                    this.setProgress(step.value, step.label);
                });
                delay += 800;
            }

            // Loop after a short pause at 100%
            this.time.delayedCall(delay + 600, run);
        };

        run();
    }

    // ==============================
    // Login
    // ==============================

    async _startLogin() {
        try {
            document.fonts.forEach(font => {
                document.fonts.load(`30px "${font.family}"`);
            });
            await document.fonts.ready;

            if (this.gameConfig.loadingScreen.show) {
                this.setProgress(0.8, 'Authenticating...');
            }

            await this.api.login();
            this.game.api = this.api;
            this._loginDone = true;
            this._checkReady();

        } catch (error) {
            console.error(error);
            if (this.gameConfig.loadingScreen.show) {
                this._statusText.setText('Connection failed');
            }
        }
    }

    async _checkReady() {
        if (!this._assetsLoaded || (!this._loginDone && this.gameConfig.loadingScreen.show)) return;

        await document.fonts.ready;

        if (this.gameConfig.loadingScreen.show) {
            this.setProgress(1, FINAL_MESSAGE+'...');
            this.time.delayedCall(500, () => this._fadeOutAndStart());
        } else {
            this.scene.start('GameController', { fontsReady: true });
        }
    }

    _fadeOutAndStart() {
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 500,
            ease: 'Sine.easeIn',
            onComplete: () => this.scene.start('GameController', { fontsReady: true }),
        });
    }

    // ==============================
    // Progress bar
    // ==============================

    setProgress(value, label) {
        if (value <= this._currentProgress) return;
        const from = this._currentProgress;
        this._currentProgress = value;

        this.tweens.add({
            targets: { v: from },
            v: value,
            duration: 400,
            ease: 'Sine.easeOut',
            onUpdate: tween => this._drawFill(tween.getValue()),
        });

        if (label) this._statusText.setText(label);
    }

    _drawFill(progress) {
        const { x, y, w, h, r } = this._barMeta;
        this._barFill.clear();
        const fillW = Math.max(r * 2, w * progress);
        this._barFill.fillStyle(COLORS.progress, 0.9);
        this._barFill.fillRoundedRect(x, y, fillW, h, r);
        this._barFill.fillStyle(0xffffff, 0.5);
        this._barFill.fillRoundedRect(x, y, fillW, h / 2, { tl: r, tr: r, bl: 0, br: 0 });
    }

    // ==============================
    // UI builders
    // ==============================

    _buildUI() {
        const W = this.scale.width;
        const H = this.scale.height;
        this._isMobile = W < H;

        this._buildBackground(W, H);
        this._buildTitle(W, H);
        if (this.gameConfig.loadingScreen.showLogo) this._buildLogo(W, H);
        this._buildProgressBar(W, H);
        this._buildStatusText(W, H);
        this._buildPulseDots(W, H);
    }

    _buildLogo(W, H){
        const logoY = this._isMobile ? 1050 : 640;
        const logoScale = 1;
        const logo = this.add.sprite(W / 2, logoY,'gameIcon').setScale(logoScale)
    }

    _buildBackground(W, H) {
        if (this.gameConfig.background?.key) {
            this.bg = this.add.sprite(0,0,this.gameConfig.background.key).setOrigin(0)
        }
        if (this._isMobile){
            this.bg.setX(1080)
            this.bg.setAngle(90)
        }
    }

    _drawArc(gfx, cx, cy, r, startAngle, endAngle) {
        const steps = 12;
        const range = endAngle - startAngle;
        gfx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const a = startAngle + (range / steps) * i;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            i === 0 ? gfx.moveTo(x, y) : gfx.lineTo(x, y);
        }
        gfx.strokePath();
    }


    _buildTitle(W, H) {
        const titleY = this._isMobile ? H * 0.45 : H * 0.45;
        const fontSize = this._isMobile ? '72px' : '100px';
        const strokeThickness = this._isMobile ? 4 : 6;
        this.add.text(
            W / 2,
            titleY,
            this.gameConfig.gameName.toUpperCase(),
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: fontSize,
                fontStyle: 'bold',
                color: '#FFF',
                stroke: '#222',
                strokeThickness: strokeThickness,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 8,
                    fill: true
                }
            }
        )
        .setOrigin(0.5);
    }

    _buildProgressBar(W, H) {
        const barW = this._isMobile ? W * 0.7 : W * 0.4;
        const barH = this._isMobile ? 20 : 10;
        const barX = (W - barW) / 2;
        const barY = this._isMobile ? H * 0.65 : H * 0.76;
        const radius = this._isMobile ? 10 : 5;

        const track = this.add.graphics();
        track.fillStyle(COLORS.track, 0.5);
        track.fillRoundedRect(barX, barY, barW, barH, radius);

        this._barFill = this.add.graphics();
        this._barMeta = { x: barX, y: barY, w: barW, h: barH, r: radius };
        this._drawFill(0);
        const border = this.add.graphics();
        border.lineStyle(0.5, COLORS.progress, 1);
        border.strokeRoundedRect(barX, barY, barW, barH, radius);
    }

    _buildStatusText(W, H) {
        const barY = this._isMobile ? H * 0.65 : H * 0.76;
        const fontSize = this._isMobile ? '40px' : '24px';
        this._statusText = this.add.text(W / 2, barY + (this._isMobile ? 70 : 40), 'Loading...', {
            fontFamily: 'Arial, sans-serif',
            fontSize: fontSize,
            color: COLORS.status,
        }).setOrigin(0.5).setAlpha(0.7);
    }

    _buildPulseDots(W, H) {
        const barY = this._isMobile ? H * 0.65 : H * 0.76;
        const cy = barY + (this._isMobile ? 130 : 70);
        const spacing = this._isMobile ? 30 : 18;
        const radius = this._isMobile ? 8 : 4;
        for (let i = 0; i < 3; i++) {
            const gfx = this.add.graphics();
            gfx.fillStyle(COLORS.progress, 0.9);
            gfx.fillCircle(W / 2 + (i - 1) * spacing, cy, radius);
            this.tweens.add({
                targets: gfx,
                alpha: 0.15,
                duration: 500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: i * 180,
            });
        }
    }
}