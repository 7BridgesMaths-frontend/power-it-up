import { GameController, LoadingScreen, BootScene } from './game'

class Game extends Phaser.Game {
    constructor(config) {
        super(config);

        this.scene.add('BootScene', BootScene, true);
        this.scene.add('LoadingScreen', LoadingScreen, false);
        this.scene.add('GameController', GameController, false);
    }
}

const portrait = window.innerHeight > window.innerWidth;

const config = {
    type: Phaser.WEBGL,
    parent: 'game',
    fullscreenTarget: 'game',
    backgroundColor: '#000',

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: portrait ? 1080 : 1920,
        height: portrait ? 1920 : 1080
    },

    dom: {
        createContainer: true
    },

    loader: {
        baseURL: import.meta.env.DEV ? '' : import.meta.url.slice(0, import.meta.url.lastIndexOf('/') + 1)
    }
};

new Game(config);