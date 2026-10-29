import { COLORS_LIST } from "../../constants/COLORS";

export default class ValuesDisplay {
    /** @type {Phaser.Scene} */
    scene;
    /** @type {number} */
    initialBalance;
    /** @type {boolean} */
    isMobile;

    container;
    balanceContainer;
    winContainer;
    balanceValueLabel;
    winValue;

    constructor({ scene, initialBalance, isMobile = false }) {
        this.scene = scene;
        this.initialBalance = initialBalance;
        this.isMobile = isMobile;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);
        const fontSize = this.isMobile ? 36 : 20;
        const labelColor = 'rgba(255, 255, 255, 0.5)';
        const valueColor = COLORS_LIST.text_white;

        this.balanceContainer = this.scene.add.container(0, 0);
        const balanceLabel = this.scene.add.text(-30, 0, "BALANCE:", {
            fontFamily: "Inter",
            fontSize: fontSize,
            fontStyle: 'bold',
            fill: labelColor,
            align: "right",
            lineSpacing: -4,
        }).setOrigin(1, 0.5);

        const balanceValue = (this.initialBalance / 100).toFixed(2);
        this.balanceValueLabel = this.scene.add.text(-20, 0, `$${balanceValue}`, {
            fontFamily: "Inter",
            fontSize: fontSize,
            fontStyle: 'bold',
            fill: valueColor,
            align: "left",
            lineSpacing: -4,
        }).setOrigin(0, 0.5);

        this.balanceContainer.add([balanceLabel, this.balanceValueLabel]);

        this.winContainer = this.scene.add.container(0, 0);
        const winLabel = this.scene.add.text(-30, 0, "WIN:", {
            fontFamily: "Inter",
            fontSize: fontSize,
            fontStyle: 'bold',
            fill: labelColor,
            align: "right",
            lineSpacing: -4,
        }).setOrigin(1, 0.5);

        this.winValue = this.scene.add.text(-20, 0, "$0.00", {
            fontFamily: "Inter",
            fontSize: fontSize,
            fontStyle: 'bold',
            fill: valueColor,
            align: "left",
            lineSpacing: -4,
        }).setOrigin(0, 0.5);

        this.winContainer.add([winLabel, this.winValue]);

        container.add([this.balanceContainer, this.winContainer]);

        return container;
    }

    getContainer() {
        return this.container;
    }

    getBalanceContainer() {
        return this.balanceContainer;
    }

    getWinContainer() {
        return this.winContainer;
    }

    updateBalance(value) {
        this.balanceValueLabel.setText(`$${value}`);
    }

    updateWin(value) {
        this.winValue.setText(`$${value}`);
    }
}
