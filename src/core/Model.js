import "phaser"
import ApiService from "../services/ApiService";

const STEP_TYPES = ['freespin', 'free_spins_end', 'cascade', 'respin', 'basegame', 'basespin'];

export default class Model extends Phaser.Events.EventEmitter {

    constructor(scene, config, api) {
        super();
        this.scene = scene
        this.config = config        
        /**
         * @type {ApiService}
         */
        this.apiService = api
        this.init();
    }

    init() {
        this.lastResult = null;

        this.baseGamePlays = this.scene.game.cache.json.get('baseGamePlays');
        this.bonusGamePlays = this.scene.game.cache.json.get('freeSpinsGamePlays');

        this.baseGamePlaysSB = this.scene.game.cache.json.get('baseGamePlaysSB');
        this.bonusGamePlaysSB = this.scene.game.cache.json.get('freeSpinsGamePlaysSB');
    
        this.bonusBuyGamePlays = this.scene.game.cache.json.get('bonusBuyGamePlays');
        this.singlePlay = this.scene.game.cache.json.get('singlePlay');

        this.spinPlays = {
            singleplay: {
                label: 'Single Play',
                fileName: 'single_play',
                normal: this.singlePlay,
                visibleInForcedPlay: true,
            },
        };

        this.setConfig();
    }

    // Game info comes from the API session. Anything missing falls back to config.js (offline mode)
    setConfig({bet, lines, paytable, version, spinTypes, side_bet_costs, symbols, bonus_buy_cost} = {}){
        this.bet = bet ?? this.config.bet
        this.lines = lines ?? []
        this.isApiPaytable = paytable != null
        this.paytable = paytable ?? this.config.paytable ?? []
        this.version = version ?? this.config.version
        this.spinTypes = this.normalizeSpinTypes(spinTypes)
        this.side_bet_costs = side_bet_costs ?? null
        this.availableSym = symbols ?? {}
        this.bonus_buy_cost = bonus_buy_cost ?? null
    }

    // Accepts either { command: name } or [{ command, name }] and returns { command: name }
    normalizeSpinTypes(spinTypes){
        if (!Array.isArray(spinTypes)) return spinTypes ?? {}
        return Object.fromEntries(spinTypes.map(({command, name}) => [command, name]))
    }

    // Payouts as bet multipliers, e.g. { 3: 0.5, 4: 1.2, 5: 5 }
    getSymbolPayout(id){
        const idInfo = this.getPayTable().find((value)=> value.id == id)
        return idInfo?.payouts ?? {}
    }

    getSymName(id){
        return this.availableSym[id]
    }

    getWaysWinningAnimation(){
        return this.config.waysWinningAnimation
    }

    getLinesWinningAnimation(){
        return this.config.linesWinningAnimation
    }

    getJackpots(){
        return this.config.jackpots
    }

    getSpinOptions() {
        const entries = Object.entries(this.spinTypes);

        if (entries.length === 0) return this.config.forcedPlays

        if (this.getDebugMode()) {
            entries.push(["file-singleplay", "SinglePlay"]);
        }

        return entries
            .filter(([spinType]) => !spinType.includes("side_bet_"))
            .map(([spinType, label]) => ({
                label,
                spinType,
                visibleInForcedPlay: true,
            }));
    }

    // Returns entries as { id, name, texture, tier, payouts, special }, with payouts as bet multipliers
    getPayTable(){
        return this.paytable.map(entry => {
            const name = entry.name ?? this.getSymName(entry.id)?.name ?? `Symbol ${entry.id}`
            const payouts = entry.payouts ?? {}

            return {
                ...entry,
                name,
                texture: entry.texture ?? `sym_${entry.id}`,
                tier: entry.tier ?? this._getTierFromName(name),
                payouts: this.isApiPaytable ? this._toBetMultipliers(payouts) : payouts,
            }
        })
    }

    _getTierFromName(name){
        const lowerName = name.toLowerCase()
        if (lowerName.startsWith('high')) return 'high'
        if (lowerName.startsWith('low')) return 'low'
        return 'special'
    }

    // API payouts come in credits for the current bet
    _toBetMultipliers(payouts){
        return Object.fromEntries(
            Object.entries(payouts).map(([count, value]) => [count, value / this.getBet()])
        )
    }

    getBalance(){
        return this.config.balance
    }

    getAvailableBets(){
        const baseBet = this.config.bet;

        const stakes = this.config.availableBets.map(value => ({
            value,
            multiplier: value / baseBet
        }));

        return stakes
    }

    getBonusBuyElements(){
        if (this.bonus_buy_cost == null) return this.config.bonusBuy

        const [bonusBuy, ...rest] = this.config.bonusBuy
        return [{ ...bonusBuy, price: this.bonus_buy_cost / this.getBet() }, ...rest]
    }

    getGapBetweenReels(){
        return this.config.reelsConfig.gapBetweenReels ?? 0
    }
    
    getGapBetweenRows(){
        return this.config.reelsConfig.gapBetweenRows ?? 0
    }

    getBigWins(){
        return this.config.bigWins
    }

    getLine(id){
        return this.lines.find(line => line.id === id) ?? null
    }

    //game properties
    getInfo() {
        return this.config.info;
    }

    getDebugMode() {
        return this.config.debug;
    }

    getGameName(){
        return this.config.gameName;
    }

    getVersion(){
        return this.version;
    }

    getBet(){
        return this.bet;
    }

    getSideBet(){
        const sidebets = this.getSideBets();
        return sidebets.length > 0 ? sidebets[0].multiplier : 0;
    }

    getSideBets(){
        if (this.side_bet_costs) {
            return Object.entries(this.side_bet_costs).map(([id, value]) => ({
                id,
                name: this.spinTypes[id]?.split(" - ")[1] ?? id,
                multiplier: value / this.getBet(),
            }))
        }

        const raw = this.config.sidebets;
        if (Array.isArray(raw) && raw.length > 0) {
            if (typeof raw[0] === 'object') return raw;
            return raw.map((m, i) => ({ id: `sidebet_${i}`, name: `${m}x`, multiplier: m }));
        }
        if (this.config.sidebet) {
            return [{ id: 'default', name: `${this.config.sidebet}x`, multiplier: this.config.sidebet }];
        }
        return [];
    }
    
    getBonusBuy(){
        return this.config.bonusBuy;
    }

    getReels() {
        return this.config.reels;
    }
    
    getReelsY(){
        return this.config.reelsY;
    }

    getTrackerReels(){
        return this.config.trackerReels;
    }

    getTrackerScaleY(){
        return this.config.trackerScaleY;
    }

    getReelById(id) {
        return this.config.reels["r" + id];
    }

    getReelsConfig(){
        return this.config.reelsConfig;
    }

    getGrid(){
        return this.config.grid;
    }

    getSymbolSize() {
        return this.config.symbolSize;
    }

    getSlotType() {
        return this.config.slotType;
    }

    // "auto" runs the step right away, "click" waits for the spin button
    getSpinTrigger(type) {
        return this.config.spinTriggers?.[type] ?? 'auto';
    }

    getRandomSpin(jsonFile){
        this.playNumber = Math.round(Math.random() * (jsonFile.spins.length - 1));
        let result = JSON.parse(JSON.stringify(jsonFile.spins[this.playNumber]));
        return result;
    }

    async getSpin({ type = 'basegame', sidebet = null, bonusBuy = null }) {
        if (type.includes('file-')) {
            const { fileName, normal } = this.spinPlays.singleplay;

            this.configFileName = fileName;
            this.lastResult = this.getRandomSpin(normal);

            console.log(`${fileName}.json: ${this.playNumber}`);

            return this.spinNextStep();
        }

        if (type === 'missing-forced') return null;

        let spinType = bonusBuy ? 'basegame' : type;
        let gameMode;
        if (bonusBuy) {
            gameMode = bonusBuy;
        } else if (sidebet) {
            // Side bets are sent as a spin type (e.g. "side_bet_1") in the regular game mode
            gameMode = 'Regular';
            spinType = sidebet.id;
        } else {
            gameMode = 'Regular';
        }

        console.log(`Spin: ${gameMode}-${spinType}`);

        try {
            this.lastResult = await this.apiService.getSpin(spinType, gameMode);

            return this.spinNextStep();
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    getPlayMeta(){
        return {file: this.configFileName, playNumber: this.playNumber}
    }

    spinNextStep() {
        if (this.lastResult == null || this.lastResult.length == 0) {
            return false;
        }

        const step = this.lastResult.shift();

        // Each step has a single key naming its type (basegame, freespin, cascade...).
        // Known types are checked first; any other key the API adds is passed through as is.
        const type = STEP_TYPES.find(key => step[key] != null)
            ?? Object.keys(step).find(key => step[key] != null);

        const result = { type, data: step[type] };

        console.log(result);
        return result
    }
}
