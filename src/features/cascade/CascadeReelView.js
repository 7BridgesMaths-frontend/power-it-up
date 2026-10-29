import ReelView from "../reels/ReelView.js";
import CascadeSymbolView from "./CascadeSymbolView.js";

export default class CascadeReelView extends ReelView {
    constructor({ scene, model, container, index, initialHeight, initialY, strip, spinCount, reelsConfig }) {
        super({ scene, model, container, index, initialHeight, initialY, strip, spinCount, reelsConfig });
    }

    _getSymbolSize() {
        return this._getResponsiveConfig().symbolSize ?? this.model.getSymbolSize();
    }

    _getRowSpacing() {
        const gapBetweenSymbols = this._getResponsiveConfig().gapBetweenRows ?? this.model.getGapBetweenRows();
        return this._getSymbolSize() + gapBetweenSymbols;
    }

    _createSymbol({ id, index }) {
        const symbolView = this._buildSymbol(id, index);

        symbolView.forcePosY();
        this.container.add(symbolView.getContainer());

        return symbolView;
    }

    stopSpinSymbols() {
        this.symbols.forEach((symbolView) => {
            symbolView?.stopSpin();
        });
    }

    async makeSymbolsFallFromScreen({ delay }) {
        const fallPromises = this.symbols.map((symbol, i) => {
            if (!symbol) return Promise.resolve();
            return symbol.fallFromScreen(delay);
        });
        await Promise.all(fallPromises);
    }

    async fallSymbolsFromAboveScreen(delay, steps) {
        const animPromises = this.symbols.map((symbol) => {
            return symbol?.fallFromAbove(delay, steps, false);
        });
        await Promise.all(animPromises);
    }

    async animateDestroySymbol(row) {
        const symbol = this.symbols[row];
        if (symbol) {
            await symbol.animateDestroy();
        }
        this.symbols[row] = null;
    }

    async animateFallSymbols() {
        const promises = [];
        for (let i = this.symbols.length - 1; i >= 0; i--) {
            let symbol = this.symbols[i];
            if (symbol == null) {
                symbol = this.getNextFallingSymbol(i - 1);
                if (symbol != null) {
                    this.symbols[i] = symbol;
                    promises.push(symbol.fallCascade(i));
                }
            }
        }
        return Promise.all(promises);
    }

    async addCascadeSymbols(strip) {
        const newSymbols = this._createMissingSymbols(strip);
        this._recalculateIndexes();
        await this._animateNewSymbols(newSymbols);
    }

    _createMissingSymbols(strip) {
        const newSymbols = [];
        let steps = 0;

        for (let i = this.symbols.length - 1; i >= 0; i--) {
            if (this.symbols[i] == null) {
                steps++;
                const symbol = this._buildSymbol(strip[i], -steps);
                symbol.container.y = -(steps - i) * this._getRowSpacing() - this._getSymbolSize();
                this.container.add([symbol.container]);
                this.symbols[i] = symbol;
                newSymbols.push({ symbol, delay: i * 50, steps: steps - i });
            } else {
                this.symbols[i].index = i;
                this.symbols[i].forcePosY();
            }
        }

        return newSymbols;
    }

    _buildSymbol(id, index) {
        return new CascadeSymbolView({
            scene: this.scene,
            model: this.model,
            symbolsPerReel: this.initialHeight,
            rowSpacing: this._getRowSpacing(),
            reelsConfig: this._getResponsiveConfig(),
            id,
            index,
        });
    }

    _recalculateIndexes() {
        this.symbols.forEach((symbol, i) => {
            if (symbol != null) symbol.index = i;
        });
    }

    async _animateNewSymbols(newSymbols) {
        const promises = newSymbols
            .filter(({ symbol }) => symbol != null)
            .map(({ symbol, delay, steps }) => symbol.fallFromAbove(delay, steps, true));

        await Promise.all(promises);
    }

    getNextFallingSymbol(startingIndex) {
        for (let i = startingIndex; i >= 0; i--) {
            let symbol = this.symbols[i];
            if (symbol != null) {
                this.symbols[i] = null;
                return symbol;
            }
        }
        return null;
    }

    async addNewSymbolsAboveTheScreen({ strip }) {
        for (let row = 0; row < this.symbols.length; row++) {
            const symbolView = this.symbols[row];
            const newIndex = (-this.symbols.length) + row;
            symbolView?.updateYPos(newIndex);
            symbolView?.changeView(strip[row]);
        }
    }

    async showWinnerSymbols(symbolPosition) {
        const winnerSymbol = this.symbols[symbolPosition];
        if (!winnerSymbol) return;
        await winnerSymbol.makeWinner();
    }
}
