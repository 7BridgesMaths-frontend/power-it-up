// @ts-check
/// <reference types="vite/client" />

/** @type {import('./types').GameConfig} */
export const config = {
    gameName: import.meta.env.VITE_GAME_NAME,
    slotType: "LINES",
    emojiFavicon: "🎰",
    version: "0",
    info: false,
    availableBets: [
        10, 20, 40, 60, 80, 100,
        200, 300, 400, 500, 600,
        800, 1000, 2000, 3000,
        4000, 5000, 10000
    ],
    balance: 10000,
    bet: 10,
    sidebets: [
        { id: 'double', name: 'SB x2', multiplier: 2 },
        { id: 'super', name: 'Super SB 5x', multiplier: 5 },
    ],
    bigWins: [
        { type: 'BIG WIN', multiplier: 25 },
        { type: 'MEGA WIN', multiplier: 50 },
    ],
    forcedPlays: [
        {
            label: 'Random game',
            spinType: 'basegame',
            visibleInForcedPlay: true,
        },
        {
            label: 'Single Play',
            spinType: 'file-singlePlay',
            visibleInForcedPlay: true,
        }
    ],
    bonusBuy: [
        {
            title: "Free Spins",
            description: "Enter to Free Spins",
            price: 100,
            type: "BB",
            priceType: "multiplier",
            texture: `sym_1`
        },
    ],
    paytable: [],
    waysWinningAnimation: {
        border: {
            visible: true,
            groupBySymbol: true
        },
        effects: ["pulse"],
        duration: 1000,
        delayBetweenWays: 200,
    },
    linesWinningAnimation: {
        effects: ["pulse"],
        duration: 1000,
        delayBetweenLines: 200,
        allLinesDuration: 0,
        winBoxes: false,
    },
    jackpots: [],
    grid: [4,4,4,4,4,4],
    reels: { 
        r0: [1,2,3,4],
        r1: [5,6,7,8],
        r2: [9,10,11,12],
        r3: [7,3,6,8],
        r4: [7,3,8,8],
        r5: [7,3,8,8]
    },
    reelsY: [0,0,0,0,0,0],
    reelsConfig: {
        x: 512,
        y: 190,
        scaleX: 0.5,
        scaleY: 0.5,
        gapBetweenReels: 0,
        gapBetweenRows: 0,
    },
    symbolSize:150,
    spinTriggers: {
        "freespin": 'auto'
    },
    debug: false,
    background: {
        key: 'bg_base',
        path: 'assets/images/ui/backgrounds/new-bg.png',
    },
    loadingScreen: {
        test: false,
        show: false,
        showLogo: false,
    },
    api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL,
        username: import.meta.env.VITE_API_USERNAME,
        password: import.meta.env.VITE_API_PASSWORD,
        secretId: import.meta.env.VITE_API_SECRET_ID,
        gameName: import.meta.env.VITE_API_GAME_NAME,
    }
}

export default config;