// Mobile overrides - only add values that change from desktop
// If a key is not defined here, desktop.config value is used

export default {
    reels: {
        x: 80,
        y: 640,
        scaleX: 1,
        scaleY: 1,
        gapBetweenReels: 0,
        gapBetweenRows: 0,
        symbolSize: 150
    },

    reelsBackground: {
        offsetX: 0,
        offsetY: 0,
        scaleX: 1,
        scaleY: 1,
        masked: true
    },

    reelsFrame: {
        offsetX: 0,
        offsetY: -12,
        scaleX: 1,
        scaleY: 0.93
    },

    controls: {
        background: {
            x: 0,
            y: 1540,
            width: 1080,
            height: 380,
            originY: 0
        },
        stats: { x: 131, y: 1766 },
        spin: { x: 534, y: 1603, radius: 120, iconSize: 180, stopIconSize: 120 },
        decreaseBet: { x: 296, y: 1602, width: 90, height: 90, fontSize: 130 },
        increaseBet: { x: 687, y: 1602, width: 90, height: 90, fontSize: 130 },
        bonusBuy: { x: 714, y: 1444 },
        sideBet: { x: 346, y: 1440 },
        turbo: { x: 275, y: 1767, hideLabel: true, radius: 50, iconSize: 50 },
        controls: { x: 790, y: 1765 },
        betSelector: { x: 67, y: 1601, scale: 1.4, panelStartY: 1920, mobileOpenY: 775 },
        forcedPlay: { x: 385, y: 1740 },
        autoPlay: { x: 808, y: 1568, hideLabel: true },
        balance: { x: 275, y: 1870 },
        win: { x: 936, y: 1869 }
    },

    ui: {
        gameName: {
            x: 38,
            y: 38
        },
        background: {
            x: 1080,
            y: 0,
            angle: 90,
        },
        fsLeft: {
            x: 540,
            y: 1350,
        },
        version: {
            x: 1010,
            y: 38,
        }
    }
};
