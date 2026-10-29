import { Model } from '../core';
import { DebugPanel } from '../utils';
import { ResponsiveManager } from '../core/ResponsiveManager';
import UIControlsBar from './UIControlsBar';
import { config } from '../config/config';
import { spinWinIn, spinWinOut } from '../animations/spinWin';


export default class UIView extends Phaser.Events.EventEmitter {

    constructor({ scene, model }) {
        super();
        /** @type {Phaser.Scene} */
        this.scene = scene;
        /** @type {Model} */
        this.model = model

        this.bet = this.model.getBet()
        this.totalBet = Number((this.bet/100).toFixed(2));

        this.createView();
    }

    createView() {
        this._createBackgrounds()
        this._createGameInfo()
        this._createSpinWinScreen()
        this._createSignScreen()
        this._createParticles()
        this._createFSLeftSign()
    }

    updateVersion(v = 0){
        const version = v?.split(".")[0]
        this.mathVersion.setText(`v${version}`)
    }

    showTimeoutScreen() {
        const scene = this.scene;

        const responsiveManager = ResponsiveManager.getForScene(scene);
        const isMobile = responsiveManager ? responsiveManager.isMobileView() : false;

        const w = isMobile ? 1080 : 1920;
        const h = isMobile ? 1920 : 1080;

        const panelWidth = isMobile ? 900 : 600;
        const panelHeight = isMobile ? 500 : 340;
        const titleFontSize = isMobile ? '64px' : '38px';
        const subtitleFontSize = isMobile ? '32px' : '18px';
        const buttonWidth = isMobile ? 320 : 180;
        const buttonHeight = isMobile ? 100 : 55;
        const buttonFontSize = isMobile ? '36px' : '20px';
        const buttonYOffset = isMobile ? 150 : 80;
        const titleYOffset = isMobile ? 140 : 90;
        const subtitleYOffset = isMobile ? 60 : 40;

        // DARK OVERLAY
        const bg = scene.add.rectangle(
            0, 0, w, h, 0x000000, 0.75
        ).setOrigin(0).setDepth(1000);

        // GLASS PANEL (main card)
        const panel = scene.add.rectangle(
            w / 2,
            h / 2,
            panelWidth,
            panelHeight,
            0x111111,
            0.95
        )
        .setDepth(1001);

        panel.setStrokeStyle(2, 0xffffff, 0.15);

        // TITLE
        const title = scene.add.text(
            w / 2,
            h / 2 - titleYOffset,
            'SESSION EXPIRED',
            {
                fontSize: titleFontSize,
                fontStyle: 'bold',
                color: '#ffffff'
            }
        )
        .setOrigin(0.5)
        .setDepth(1002);

        // SUBTEXT
        const subtitle = scene.add.text(
            w / 2,
            h / 2 - subtitleYOffset,
            'You were inactive for too long',
            {
                fontSize: subtitleFontSize,
                color: '#bbbbbb'
            }
        )
        .setOrigin(0.5)
        .setDepth(1002);

        // BUTTONS BASE STYLE
        const createButton = (x, y, text, color) => {
            const btn = scene.add.rectangle(
                x, y, buttonWidth, buttonHeight, color, 1
            )
            .setInteractive({cursor: 'pointer'})
            .setDepth(1002);

            const label = scene.add.text(
                x, y,
                text,
                {
                    fontSize: buttonFontSize,
                    fontStyle: 'bold',
                    color: '#000000'
                }
            )
            .setOrigin(0.5)
            .setDepth(1003);

            // hover effect
            btn.on('pointerover', () => {
                btn.setScale(1.05);
            });

            btn.on('pointerout', () => {
                btn.setScale(1);
            });

            return { btn, label };
        };

        // RESTART BUTTON
        const restart = createButton(
            w / 2,
            h / 2 + buttonYOffset,
            'RESTART',
            0xffcc00
        );

        restart.btn.on('pointerdown', () => {
            location.reload();
        });

        // small animation pop-in (nice touch)
        panel.setScale(0.8);
        scene.tweens.add({
            targets: panel,
            scale: 1,
            duration: 150,
            ease: 'Back.Out'
        });
    }

    getContainersToShowBorder(){
        const result = []
        return result
    }

    _createFSLeftSign(){
        this.FSLeftBackground = this.scene.add.sprite(1535,510,'ui',"FSleft_label").setScale(1.1).setVisible(false).applyResponsive('ui.fsLeft')
        this.FSLeft = this.scene.add.bitmapText(this.FSLeftBackground.x, this.FSLeftBackground.y - 20, 'slotFont', "10", 18).setOrigin(0.5).setVisible(false)
    }

    _createParticles(){
        this.sparkEmitter = this.scene.add.particles(0, 0,'spark',{
            scale: { start: 1.5, end: 0 },
            speed:200,
            frequency: 30,
            lifespan: 1000,
            blendMode: "LIGHTEN",
            emitting: false
        })
    }

    _createSignScreen(){
        this.signContainer = this.scene.add.container(0, 0).setDepth(100)
        this.blackScreenBackground = this.scene.add.graphics();
        this.blackScreenBackground.fillStyle('#fff', 0.8);

        const responsiveManager = ResponsiveManager.getForScene(this.scene);
        const isMobile = responsiveManager ? responsiveManager.isMobileView() : false;
        const screenW = isMobile ? 1080 : 1920;
        const screenH = isMobile ? 1920 : 1080;
        this.blackScreenBackground.fillRect(0, 0, screenW, screenH);
        this.blackScreenBackground.setDepth(0);

        const centerX = this.scene.cameras.main.centerX
        const centerY = this.scene.cameras.main.centerY

        const titleY = isMobile ? 480 : 260;
        const subtitleY = isMobile ? 720 : 380;
        const amountY = isMobile ? centerY - 100 : centerY - 50;
        const featureWonY = isMobile ? 1340 : 720;
        const titleFontSize = isMobile ? 56 : 38;
        const subtitleFontSize = isMobile ? 38 : 26;
        const amountFontSize = isMobile ? 96 : 64;
        const featureWonFontSize = isMobile ? 38 : 26;

        this.title_SIGN = this.scene.add.bitmapText(centerX, titleY, 'slotFont', `CONGRATULATIONS!`, titleFontSize).setOrigin(0.5).setDepth(2)
        this.subtitle_SIGN = this.scene.add.bitmapText(centerX, subtitleY, 'slotFont', `You've Won`, subtitleFontSize).setOrigin(0.5).setDepth(2)
        this.amount_SIGN = this.scene.add.bitmapText(centerX, amountY, 'slotFont', `6`, amountFontSize).setOrigin(0.5).setDepth(2)

        this.featureWon_SIGN = this.scene.add.bitmapText(centerX, featureWonY, 'slotFont', `FREE SPINS`, featureWonFontSize).setOrigin(0.5).setDepth(2)

        this.signContainer.add([
            this.blackScreenBackground,
            this.title_SIGN,
            this.subtitle_SIGN,
            this.amount_SIGN,
            this.featureWon_SIGN,
        ])

        this.signContainer.setVisible(false)
    }

    _resetElements(){
        const centerX = this.scene.cameras.main.centerX
        const centerY = this.scene.cameras.main.centerY

        const responsiveManager = ResponsiveManager.getForScene(this.scene);
        const isMobile = responsiveManager ? responsiveManager.isMobileView() : false;

        const titleY = isMobile ? 480 : 260;
        const subtitleY = isMobile ? 720 : 380;
        const amountY = isMobile ? centerY - 100 : centerY - 50;
        const featureWonY = isMobile ? 1340 : 720;
        const titleFontSize = isMobile ? 56 : 38;
        const subtitleFontSize = isMobile ? 38 : 26;
        const amountFontSize = isMobile ? 96 : 64;
        const featureWonFontSize = isMobile ? 38 : 26;

        this.title_SIGN.setScale(0).clearTint().setPosition(centerX, titleY).setFontSize(titleFontSize)
        this.subtitle_SIGN.setScale(0).clearTint().setPosition(centerX, subtitleY).setFontSize(subtitleFontSize)
        this.amount_SIGN.setScale(0).clearTint().setPosition(centerX, amountY).setFontSize(amountFontSize)
        this.featureWon_SIGN.setScale(0).clearTint().setPosition(centerX, featureWonY).setFontSize(featureWonFontSize)
    }

    _animateBackground(){
        return new Promise((resolve)=>{
            this.scene.add.tween({
                targets: [this.blackScreenBackground],
                alpha: {from: 0, to: 1},
                duration: 700,
                ease: 'Cubic.Out',
                onComplete: resolve
            })
        })
    }

    _animateGrowElement(element){
        return new Promise((resolve)=>{
            this.scene.add.tween({
                targets: [element],
                scale: {from: 0, to: 1},
                duration: 250,
                delay: 350,
                ease: 'Back.Out',
                onComplete: resolve
            })
        })
    }

    _createSpinWinScreen(){
        this.spinWinBackground = this.scene.add.graphics();
        this.spinWinBackground.fillStyle('#fff', 0.3);

        const responsiveManager = ResponsiveManager.getForScene(this.scene);
        const isMobile = responsiveManager ? responsiveManager.isMobileView() : false;
        const screenW = isMobile ? 1080 : 1920;
        const screenH = isMobile ? 1920 : 1080;
        const textX = isMobile ? 540 : 950;
        const textY = isMobile ? 960 : 520;
        const fontSize = isMobile ? '90pt' : '90pt';

        this.spinWinBackground.fillRect(0, 0, screenW, screenH);
        this.spinWinBackground.setDepth(100).setVisible(false)

        this.spinWinText = this.scene.add.text(textX, textY, "$ 0.04", {
            font: `bold ${fontSize} Arial`,
            fill: "#fcca03",
            stroke:"#000",
            strokeThickness: 8
        }).setDepth(101).setOrigin(0.5).setVisible(false)
    }

    _createGameInfo(){
        this.gameName = this.model.getGameName()
        this.mainTitle = this.scene.add.text(0, 0, this.gameName, {
            font: "bold 24pt Arial", fill: "#fff"
        }).setOrigin(0).setDepth(1).applyResponsive('ui.gameName');

        let version = this.model.getVersion();
        this.mathVersion = this.scene.add.text(0, 0, version, {
            font: "bold 24pt Arial", fill: "#fff"
        }).applyResponsive('ui.version');
    }

    _createBackgrounds(){
        if (config.background?.key) {
            this.background = this.scene.add.sprite(0,0,config.background.key).setOrigin(0).applyResponsive('ui.background')
        }
    }

    updateFSLeft(fs){
        this.FSLeft.setText(fs)
    }

    async showSpinWin(value){
        if (value == 0) return;
    
        await spinWinIn({ background: this.spinWinBackground, text: this.spinWinText, value })
    }

    animateCash(element, value){
        let currentValue = 0;

        return new Promise((resolve)=>{
            this.scene.tweens.addCounter({
                from: 0.00,
                to: value,
                duration: 800,
                ease: 'Cubic.Out',
                onUpdate: (tween) => {
                    currentValue = tween.getValue();
                    element.setText("$"+parseFloat(currentValue).toFixed(2));
                },
                onComplete: resolve
            });
        })
    }

    async closeSpinWin(){
        await spinWinOut({ background: this.spinWinBackground, text: this.spinWinText })
    }

    async showBigWin(value, bigWin = "BIG WIN"){
        this.signContainer.setVisible(true)
        this._resetElements()

        const responsiveManager = ResponsiveManager.getForScene(this.scene);
        const isMobile = responsiveManager ? responsiveManager.isMobileView() : false;

        const titleY = isMobile ? 640 : 340;
        const amountY = isMobile ? 960 : 510;
        const titleFontSize = isMobile ? 64 : 44;
        const amountFontSize = isMobile ? 96 : 64;

        this.title_SIGN.setText(bigWin).setFontSize(titleFontSize).setY(titleY);
        this.amount_SIGN.setText("$0.00").setTint(0xffd54f).setY(amountY).setFontSize(amountFontSize);

        this._animateBackground()
        this._animateGrowElement(this.title_SIGN)
        this._animateGrowElement(this.amount_SIGN)
        await this.animateCash(this.amount_SIGN, value)
    }


    async closeBigWin(){
        await this._hideSignElements([
            this.title_SIGN,
            this.amount_SIGN,
        ])
    }

    showBaseScene(){
        if (this.background && config.background?.key) {
            this.background.setTexture(config.background.key)
        }
        this.FSLeft.setVisible(false)
        this.FSLeftBackground.setVisible(false)
    }

    showFreeGamesScene(fgs){
        this.background.setTexture('bg_fs')
        this.FSLeft.setVisible(true)
        this.FSLeftBackground.setVisible(true)
    }

    async showNoWinSign(){
        this.signContainer.setVisible(true)
        this._resetElements()

        const responsiveManager = ResponsiveManager.getForScene(this.scene);
        const isMobile = responsiveManager ? responsiveManager.isMobileView() : false;

        const titleY = isMobile ? 720 : 390;
        const subtitleY = isMobile ? 960 : 510;
        const titleFontSize = isMobile ? 64 : 44;
        const subtitleFontSize = isMobile ? 42 : 26;

        this.title_SIGN.setText("UNLUCKY").setFontSize(titleFontSize).setY(titleY);
        this.subtitle_SIGN.setText("Better luck next time").setTint(0xffd54f).setY(subtitleY).setFontSize(subtitleFontSize);

        this._animateBackground()
        this._animateGrowElement(this.title_SIGN)
        await this._animateGrowElement(this.subtitle_SIGN)
    }

    async _hideSignElements(elements = []){
        if (elements.length == 0) return

        const tween = (targets, props) =>
            new Promise(resolve =>
                this.scene.tweens.add({
                    targets,
                    ...props,
                    onComplete: resolve,
                })
            );

        const closingTweens = elements.map((element)=>{
            return tween(element, {
                scale: 0,
                duration: 300,
                ease: 'Back.In',
            })
        })

        await Promise.all(closingTweens);

        await tween([this.blackScreenBackground], {
            alpha: { from: 1, to: 0 },
            duration: 200,
            ease: 'Cubic.In',
        });

        this.signContainer.setVisible(false)
    }

    async closeNoWinSign(){
        await this._hideSignElements([
            this.title_SIGN,
            this.subtitle_SIGN,
        ])
    }

    async showTotalWin(win){
        this.signContainer.setVisible(true)
        this._resetElements()

        const responsiveManager = ResponsiveManager.getForScene(this.scene);
        const isMobile = responsiveManager ? responsiveManager.isMobileView() : false;

        const titleY = isMobile ? 600 : 320;
        const amountY = isMobile ? 880 : 465;
        const titleFontSize = isMobile ? 64 : 44;
        const amountFontSize = isMobile ? 96 : 64;

        this.title_SIGN.setText("TOTAL WIN").setFontSize(titleFontSize).setY(titleY)
        this.amount_SIGN.setText("$0.00").setTint(0xffd54f).setY(amountY).setFontSize(amountFontSize)

        this._animateBackground()
        await this._animateGrowElement(this.title_SIGN)
        this._animateGrowElement(this.amount_SIGN)
        await this.animateCash(this.amount_SIGN, win)
    }

    async closeTotalWin(){
        await this._hideSignElements([
            this.title_SIGN,
            this.amount_SIGN,
        ])
    }
	
    async showWonFreeGamesSign(fgs){
        this.signContainer.setVisible(true)
        this._resetElements()

        const responsiveManager = ResponsiveManager.getForScene(this.scene);
        const isMobile = responsiveManager ? responsiveManager.isMobileView() : false;

        const titleY = isMobile ? 760 : 320;
        const subtitleY = isMobile ? 880 : 440;
        const amountY = isMobile ? 1000 - 50 : 560 - 40;
        const featureWonY = isMobile ? 1140 : 720;
        const titleFontSize = isMobile ? 36 : 44;
        const subtitleFontSize = isMobile ? 24 : 26;
        const amountFontSize = isMobile ? 64 : 64;
        const featureWonFontSize = isMobile ? 24 : 26;

        this.title_SIGN.setText("CONGRATULATIONS!").setFontSize(titleFontSize).setY(titleY);
        this.scene.sound.play('bonusWon', {volume: 0.1});
        this.subtitle_SIGN.setText("You've Won").setFontSize(subtitleFontSize).setY(subtitleY);
        this.amount_SIGN.setText(fgs).setTint(0xffd54f).setFontSize(amountFontSize).setY(amountY);
        this.featureWon_SIGN.setText("FREE SPINS").setFontSize(featureWonFontSize).setY(featureWonY);

        this._animateBackground()
        this._animateGrowElement(this.title_SIGN)
        this._animateGrowElement(this.subtitle_SIGN)
        await this._animateGrowElement(this.featureWon_SIGN)
        await this._animateGrowElement(this.amount_SIGN)
    }

    async closeWonFreeGamesSign(){
        await this._hideSignElements([
            this.title_SIGN,
            this.subtitle_SIGN,
            this.amount_SIGN,
            this.featureWon_SIGN,
        ])
    }
}
