// Desktop values - base positions used in the game
// Mobile config overrides these per-game

export default {
    reels: {
        x: 512,
        y: 190,
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

    cascade: {
        x: 0,
        y: 190,
        scaleX: 1,
        scaleY: 1,
        gapBetweenReels: 0,
        gapBetweenRows: 0,
        symbolSize: 150
    },

    controls: {
        background: {
            x: 0,
            y: 950,
            width: 1920,
            height: 130
        },
        stats: { x: 33, y: 1015 },
        spin: { x: 960, y: 990, stopIconSize: 90},
        controlsContainer: { x: 568, y: 950 },
        betSelector: { panelOffsetX: -88, panelOffsetY: -277 },
        bonusBuy: { x: 340, y: 1015 },
        sideBet: { x: 470, y: 1000 },
        turbo: { x: 210, y: 1000 },
        controls: { x: 90, y: 985 },
        autoPlay: { x: 1135, y: 978 },
        forcedPlay: { x: 1365, y: 980 },
        values: { x: 1725, y: 990 },
        balance: { x: 1808, y: 995 },
        win: { x: 1828, y: 1035 }
    },

    ui: {
        gameName: {
            x: 32,
            y: 32
        },
        background: {
            x: 0,
            y: 0
        },
        fsLeft: {
            x: 1535,
            y: 510,
        },
        version: {
            x: 1860,
            y: 32
        },
    }
};
