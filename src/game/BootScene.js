import { config } from "../config/config";
import { DebugPanel } from "../utils";

export default class BootScene extends Phaser.Scene {

    constructor() {
        super('BootScene');
        this.gameConfig = config;
    
    }

    async preload() {
        if (this.gameConfig.loadingScreen.showLogo){
            this.load.image(
                'gameIcon',
                'assets/images/ui/screens/icon.png'
            );
        }
        if (config.background?.key) {
            this.load.image(config.background.key, config.background.path);
        }
    }

    create() {
        this.scene.start(
            'LoadingScreen'
        );
    }
}