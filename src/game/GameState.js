import { Model } from "../core"

export default class GameState {
    constructor({model}) {
        /** @type { Model } */
        this.model = model
        // Unidad: Centavos
        this.bet = this.model.getBet()
        this.betLevel = this.bet
        this.totalBet = this.bet

        this.sideBet = false
        this.sideBetValue = 0
        this.spinWin = 0
        this.totalWin = 0

        this.balance = this.model.getBalance()

        this.bonusActive = false

        this.freeSpins = 0
        this.remainingFreeGames = 0
        this.gameType = this.model.getSpinOptions()[0]?.spinType ?? "basegame"
        this.bigWin = false
        
        this.autoPlay = false
        this.autoPlayRounds = 0

        this.isTurbo = false;
        this.lastChargedAmount = 0;

        this.bonusBuy = {}
    }

    resetValues(){
        this.spinWin = 0;
        this.freeSpins = 0
        this.remainingFreeGames = 0
        this.bigWin = false;
    }

    // -------------------
    // AUTOPLAY
    // -------------------

    setAutoPlay(isActive){
        this.autoPlay = isActive
    }

    getRoundsLeft(){
        return this.autoPlayRounds
    }

    setAutoPlayRounds(rounds){
        this.autoPlayRounds = rounds
    }

    isAutoPlay(){
        return this.autoPlay && this.autoPlayRounds > 0
    }

    consumeAutoPlayRound(){
        this.autoPlayRounds--;
    }
    
    shouldContinueAutoPlay() {
        if (!this.autoPlay) return false;

        if (this.autoPlayRounds <= 0) {
            this.autoPlay = false;
            this.autoPlayRounds = 0;
            return false;
        }

        return true;
    }

    // -------------------
    // turboPlay
    // -------------------
    setTurbo(value) {
        this.isTurbo = value;
    }

    getTurbo() {
        return this.isTurbo;
    }
    // -------------------
    // BALANCE
    // -------------------

    canAfford(value) {
        return this.balance >= value;
    }

    chargeBet() {
        if (!this.canAfford(this.totalBet)) return false;
        this.lastChargedAmount = this.totalBet;
        this.balance -= this.totalBet;
        return true;
    }

    chargeBonus({ cost, priceType }) {
        let bonusCost;
        const baseBet = this.betLevel || this.totalBet;

        if (priceType === 'multiplier') {
            bonusCost = baseBet * cost;
        } else if (priceType === 'fixed') {
            bonusCost = cost;
        }

        if (!this.canAfford(bonusCost)) return false;

        this.lastChargedAmount = bonusCost;
        this.balance -= bonusCost;
        return true;
    }

    refundBalance() {
        if (this.lastChargedAmount > 0) {
            this.balance += this.lastChargedAmount;
            this.lastChargedAmount = 0;
        }
    }

    setTotalWin(value) {
        this.totalWin = value * (this.betLevel / this.bet);
    }

    getTotalWin(){
        return (this.totalWin / 100).toFixed(2);
    }

    addWin(value) {
        const real = value * (this.betLevel / this.bet);

        this.balance += real;
        this.totalWin += real;
        this.spinWin = real

        this._calculateBigWin(value)
    }

    hasNoWinOrFreeGames(){
        return this.spinWin === 0 && this.freeSpins === 0 && this.remainingFreeGames <= 0;
    }

    _calculateBigWin(value) {
        const bigWins = this.model.getBigWins();
        this.bigWin = false;

        const multiplier = value / this.bet;

        for (const bw of bigWins) {
            if (multiplier >= bw.multiplier) {
                this.bigWin = bw;
            }
        }

        return this.bigWin;
    }

    isBigWin(){
        return this.bigWin
    }

    getBalance() {
        return (this.balance / 100).toFixed(2);
    }

    // -------------------
    // BET
    // -------------------

    setBet(amount) {
        this.totalBet = amount;
    }

    getBet() {
        return this.betLevel;
    }

    getBaseBet() {
        return this.betLevel || this.totalBet;
    }

    setTotalBet(value){
        this.betLevel = value
        this.totalBet = this.sideBet ? value * this.sideBetValue : value
        const sidebetName = this.sideBet ? this.sideBetId : 'none';
        console.log(`TOTALBET: ${this.totalBet}, sidebet: ${sidebetName}, value: ${value}`);
    }

    // -------------------
    // SIDE BET
    // -------------------

    setSideBet(isSideBet, sideBet = null){
        this.sideBet = isSideBet
        if (sideBet) {
            this.sideBetId = sideBet.id
            this.sideBetName = sideBet.name
            this.sideBetValue = sideBet.multiplier
        }
    }

    getSideBetId(){
        return this.sideBetId
    }

    getSideBetName(){
        return this.sideBetName
    }

    getSideBetValue(){
        return this.sideBetValue
    }

    isSideBet(){
        return this.sideBet
    }

    // -------------------
    // GAME TYPE
    // -------------------

    setGameType(type) {
        this.gameType = type
    }

    getGameType() {
        return this.gameType;
    }

    // -------------------
    // FREE SPINS
    // -------------------

    setBonus(isActive){
        this.bonusActive = isActive
    }

    isBonusActive(){
        return this.bonusActive
    }

    hasFreeSpins() {
        return this.freeSpins > 0;
    }

    consumeFreeSpin() {
        if (this.freeSpins > 0) {
            this.freeSpins--;
            return true;
        }
        return false;
    }

    addFreeSpins(amount = 0) {
        this.freeSpins += amount;
    }

    setRemainingFreeSpins(amount){
        this.remainingFreeGames = amount
    }

    getRemainingFreeSpins(){
        return this.remainingFreeGames
    }

    // -------------------
    // BONUS BUY
    // -------------------

    setBonusBuy(bonusBuyInfo){
        this.bonusBuy = bonusBuyInfo
    }

    // -------------------
    // WIN
    // -------------------

    setSpinWin(value) {
        this.spinWin = value * (this.betLevel / this.bet);
    }

    getSpinWin(){
        return (this.spinWin / 100).toFixed(2); 
    }
}