---
sidebar_position: 3
---

# Flujo del Spin

El flujo estándar que sigue el juego en cada spin.

---

## Diagrama de Flujo Completo

```
Usuario → Spin/Stop Button
     │
     ▼
UIControlsBar._onSpinClick()
     │
     ▼
GameController.startSpin()
     │
     ├─► chargeBalance() → GameState.chargeBet()
     │       │
     │       └─► ¿Balance suficiente?
     │               ├─ No → enableControls() y return
     │               └─ Sí → Continua
     │
     ▼
_prepareUI() → disableControls(), reset wins
     │
     ▼
Model.getSpin() → Obtiene jugada (API/JSON)
     │
     ▼
spinResponse()
     │
     ├─► _updateAutoPlay() → Decrementa rondas
     ├─► _prepareForSpin() → Prepara UI
     ├─► _animateReels() → Animación
     └─► _resolveResult() → Evalúa ganancias
             │
             ▼
         handleSpinEnd()
             │
             ├─► ¿Cascada/Respin? → spinResponse() [recursión]
             │
             └─► spinFinished() → enableControls()
```

---

## Métodos Principales

### `startSpin()`

Ubicación: `GameController.js`

```javascript
async startSpin({isBonusBuy = false, type}) {
    // 1. Cobra el balance
    if (!this.chargeBalance(isBonusBuy)) {
        this.controls_bar.enableControls();
        return;
    }

    // 2. Prepara UI (deshabilita controles)
    this._prepareUI();

    // 3. Obtiene spin del modelo
    const newPlay = await this.model.getSpin({...});

    // 4. Procesa respuesta
    await this.spinResponse(newPlay);
}
```

### `spinResponse()`

Ubicación: `GameController.js`

```javascript
async spinResponse(result) {
    try {
        this._updateAutoPlay();
        await this._prepareForSpin(result);
        await this._animateReels();
        await this._resolveResult();
    } catch (error) {
        console.error('Spin error:', error);
        this.controls_bar.enableControls();
    }
}
```

### `_prepareForSpin()`

```javascript
async _prepareForSpin(result) {
    await this.resetWinAnimations();
    this.controls_bar.enableStopButton();

    this.state.resetValues();
    this.lastResult = new SpinResult(result);

    // Agrega free spins si hay
    this.state.addFreeSpins(this.lastResult.freeGames);

    // Actualiza reels con nuevos símbolos
    this.reelsController.addNewSymbols(this.lastResult.reelsSlices);
}
```

---

## Estados de Controles

### Durante Spin

```javascript
// UIControlsBar
isSpinning = true;
spinButton.hideSpin();
spinButton.showStop();
betSelector.disable();
autoPlayPanel.disable();
sideBetButton.disable();
// ...
```

### Después de Spin

```javascript
// UIControlsBar.enableControls()
isSpinning = false;
spinButton.showSpin();
spinButton.hideStop();
spinButton.enableSpin();
betSelector.enable();
sideBetButton.enable();
// ...
```

---

## Flujo de Side Bet

### Activación de Side Bet

```
Usuario hace click en SideBetButton
     │
     ▼
SideBetButton.toggle()
     │
     ├─► Cyclea currentIndex (0, 1, 2, ... o -1 para OFF)
     ├─► Actualiza estado visual (texto, color)
     │
     ▼
onToggle(isSideBet, sideBet)
     │
     ▼
UIControlsBar._onSideBetToggle()
     │
     └─► emit('setSideBet', isSideBet, sideBet)
             │
             ▼
         GameController
             │
             ├─► state.setSideBet(isSideBet, sideBet)
             ├─► betSelector.setSideBetMultiplier(multiplier)
             └─► state.setTotalBet(state.getBaseBet())
```

### Cálculo de Apuesta con Side Bet

```javascript
// GameState.setTotalBet()
setTotalBet(value){
    this.betLevel = value
    // Si sidebet activo, multiplica el valor
    this.totalBet = this.sideBet ? value * this.sideBetValue : value
}
```

### Visualización en Panel de Apuestas

Cuando el side bet está activo:
- Los botones de apuestas en el panel muestran valores multiplicados
- Los bordes se vuelven amarillos (color accent)
- El texto se vuelve amarillo

```javascript
// BetSelector.setSideBetActive()
setSideBetActive(isActive) {
    // Actualiza color de bordes y texto de todos los botones
}
```

---

## Flujo de Bonus Buy

### Activación de Bonus Buy

```
Usuario hace click en BonusBuyPanel
     │
     ▼
UIControlsBar._onBonusBuyClick()
     │
     └─► emit('bonusBuy', bonusInfo)
             │
             ▼
         GameController
             │
             ├─► ¿Side bet activo?
             │       ├─ Sí → state.setSideBet(false)
             │       │        betSelector.setSideBetMultiplier(1)
             │       │        sideBetButton.setActive(false)
             │       │
             ├─► state.setBonusBuy(bonusInfo)
             └─► startSpin({isBonusBuy: true, type: ...})
```

### Cálculo de Costo Bonus Buy

El costo del bonus se calcula sobre la **apuesta base**, sin incluir el side bet:

```javascript
// GameState.chargeBonus()
chargeBonus({ cost, priceType }) {
    // Usa betLevel (apuesta base) no totalBet
    const baseBet = this.betLevel || this.totalBet;

    if (priceType === 'multiplier') {
        bonusCost = baseBet * cost;  // No multiplica por sidebet!
    } else if (priceType === 'fixed') {
        bonusCost = cost;
    }

    if (!this.canAfford(bonusCost)) return false;
    this.balance -= bonusCost;
    return true;
}
```

### Ejemplo

Con bet = $1.00 (100 centavos), sidebet x2 activo:
- **Spin normal**: cobra 200 centavos (100 * 2)
- **Bonus Buy 100x**: cobra 100 centavos (100 * 1, sin sidebet)

---

## Cascadas y Respins

Cuando `handleSpinEnd()` detecta una nueva respuesta de cascada/respin, llama recursivamente a `spinResponse()`:

```javascript
async handleSpinEnd() {
    const response = this.model.spinNextStep();

    if (!response) {
        this.spinFinished();
        return;
    }

    await this.spinResponse(response); // Recursión
}
```

### Flujo de Cascade

```
Spin inicial → Ganancias detectadas
     │
     ▼
handleSpinEnd() → model.spinNextStep()
     │
     ▼
¿Hay más símbolos?
     │
     ├─ Sí → CascadeController maneja la caída
     │         └── spinResponse() con nuevos símbolos
     │
     └─ No → spinFinished()
```

---

## Free Spins

El flujo de free spins es manejado por:

1. **`GameState.addFreeSpins(n)`** - Agrega free spins
2. **`GameState.consumeFreeSpin()`** - Consume un free spin
3. **`GameState.isBonusActive()`** - Verifica si está activo

### Free Spins con Side Bet

Si el jugador tenía side bet activo cuando entraron los free spins:
- El side bet **permanece activo** durante los free spins
- Las ganancias se calculan sobre `betLevel * sideBetValue`

---

## Auto Play

### Flujo

```
Usuario configura Auto Play → N rondas
     │
     ▼
GameController.startSpin()
     │
     ├─► Decrementa ronda en cada spin
     │
     └─► Auto para cuando:
              - Rondas agotadas
              - Balance insuficiente
              - Usuario presiona STOP
```

### Método clave

```javascript
_updateAutoPlay() {
    if (this.state.isAutoPlaying) {
        this.state.decrementAutoPlayRounds();
        if (this.state.autoPlayRounds <= 0) {
            this.stopAutoPlay();
        }
    }
}
```

---

## Charge Balance

### Spin Normal

```javascript
// GameState.chargeBet()
chargeBet() {
    if (!this.canAfford(this.totalBet)) return false;
    this.balance -= this.totalBet;
    this.lastChargedAmount = this.totalBet;
    return true;
}
```

### Bonus Buy

```javascript
// GameState.chargeBonus()
chargeBonus({ cost, priceType }) {
    // Siempre usa apuesta BASE (sin sidebet multiplier)
    const baseBet = this.betLevel || this.totalBet;
    // ... cálculo de costo
}
```
