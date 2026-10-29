# Arquitectura

Visión general de la arquitectura del prototipo base de slot machine.

---

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         GameController                          │
│                    (Orquestador Principal)                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  GameState   │  │    Model     │  │   ReelsController    │  │
│  │ (Estado)     │  │ (Datos/API)  │  │   (Animaciones)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                     │              │
│         └──────────────────┼─────────────────────┘              │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                         UIView                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │ UIControls │  │ StatsPanel  │  │  ReelView[]     │   │   │
│  │  │    Bar     │  │ (DOM)       │  │  (5-6 reels)    │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos Principal

### Spin Flow

```
Usuario hace click en Spin
         │
         ▼
UIControlsBar._onSpinClick()
         │
         ▼
GameController.startSpin()
         │
         ├─► chargeBalance() ─► GameState.chargeBet()
         │                         │
         │                    ¿Balance suficiente?
         │                    ├─ No  ─► enableControls() y return
         │                    └─ Sí  ─► continua
         │
         ▼
_prepareUI() ─► disableControls(), reset win displays
         │
         ▼
Model.getSpin() ◄── Pide Jugada a la API/JSON
         │
         ▼
spinResponse() ─► _prepareForSpin() ─► _animateReels()
         │                                    │
         │                              ┌────┴────┐
         │                              ▼         ▼
         │                        reels giran  stop visible
         │                              │         │
         │                              └────┬────┘
         │                                   ▼
         │                            _resolveResult()
         │                                   │
         │                              ┌────┴────┐
         │                              ▼         ▼
         │                         hay cascade  no cascade
         │                              │         │
         │                              ▼         │
         │                        handleSpinEnd  │
         │                        spinResponse() │ recursion
         │                              │         │
         │                              └────┬────┘
         │                                   ▼
         │                            spinFinished()
         │                            enableControls()
         │
         ▼
handleSpinEnd() ─► ¿Nuevo spin step?
         │
         ├─ Sí ─► spinResponse() (recursión)
         │
         └─ No ─► spinFinished()
                    enableControls()
```

---

## Componentes Principales

### GameController (`src/game/GameController.js`)

Orquestador principal del juego. Maneja:
- Flujo de spin completo
- Comunicación entre componentes
- Estado global del juego
- Eventos de UI
- Bonus Buy
- Auto Play

**Responsabilidades:**
- Coordinar todos los componentes
- Manejar el estado del juego (spinning, idle, etc.)
- Procesar resultados de spin
- Gestionar cascadas y respins

### GameState (`src/game/GameState.js`)

Estado global del juego (estado lógico, no Phaser state):
- Balance actual
- Apuesta base (`betLevel`)
- Apuesta total (`totalBet`) incluyendo sidebets
- Ganancias (`totalWin`)
- Free spins activos
- Side bet activo (`sideBet`, `sideBetValue`)
- Auto play
- Turbo mode

**Importante:** El `totalBet` se calcula como:
```javascript
totalBet = sideBet ? betLevel * sideBetValue : betLevel
```

### Model (`src/core/Model.js`)

Maneja datos y comunicación con backend:
- Selecciona jugadas del JSON o API
- Normaliza resultados
- Maneja API de spins

### UIView (`src/ui/UIView.js`)

Capa visual principal:
- Background
- Grid de símbolos (reels)
- Overlays de ganar
- Partículas

### UIControlsBar (`src/ui/UIControlsBar.js`)

Botonera principal del juego:
- SpinButton (spin/stop)
- SideBetButton (side bet cíclico)
- BetSelector (selección de apuesta)
- AutoPlayPanel
- BonusBuyPanel
- TurboButton
- StatsButton
- ValuesDisplay
- ControlsGroup

### ReelsController (`src/features/reels/ReelsController.js`)

Maneja la animación y sincronización de reels.

### ReelView (`src/features/reels/ReelView.js`)

Representa un reel individual. Usa SymbolView para los símbolos.

### SymbolView (`src/features/symbols/SymbolView.js`)

Representa un símbolo individual en el reel.

---

## Estados del Juego

| Estado | Descripción |
|--------|-------------|
| `idle` | Esperando input del jugador |
| `spinning` | Animación de reels en curso |
| `resolving` | Evaluando ganancias |
| `freeSpins` | Modo free spins activo |
| `bonus` | Modo bonus activo |
| `autoPlay` | Auto spin ejecutándose |

---

## Eventos del Sistema

### UIControlsBar → GameController

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `startSpin` | - | Usuario presionó spin |
| `stopSpin` | - | Usuario presionó stop |
| `updateTotalBet` | `value` | Cambió apuesta |
| `setSideBet` | `isSideBet, sideBet` | Activó/desactivó side bet |
| `setTurbo` | `isTurbo` | Toggle turbo |
| `autoPlay` | `rounds` | Inició auto play |
| `stopAutoPlay` | - | Detuvo auto play |
| `bonusBuy` | `bonusInfo` | Compró bonus |
| `setGameType` | `value` | Cambió tipo de juego |

### GameController → Componentes

| Evento | Descripción |
|--------|-------------|
| `updateBalance` | Actualiza balance en UI |
| `updateWin` | Actualiza ganancias |
| `showFreeSpins` | Muestra overlay de free spins |
| `showBonus` | Muestra overlay de bonus |
| `bigWin` | Trigger animación big win |

---

## Integración Side Bet

El sistema de side bet funciona de forma **independiente** del BetSelector:

```
SideBetButton (UI)
    │
    │ emit('setSideBet', isSideBet, sideBet)
    ▼
GameController
    │
    ├─► state.setSideBet(isSideBet, sideBet)
    ├─► betSelector.setSideBetMultiplier(multiplier)
    └─► state.setTotalBet(state.getBaseBet())
```

### Bonus Buy con Side Bet

Cuando se activa un Bonus Buy con side bet activo:
1. El side bet se desactiva automáticamente
2. El costo del bonus se calcula sobre la apuesta base (sin side bet)

---

## Integración Cascade

El sistema de cascade es **independiente** de reels:

```
ReelsController (vertical)
    │
    │ _createControllers()
    ▼
CascadeController (horizontal)
    │
    │ Usa símbolos diferentes (CascadeSymbolView)
    │ No comparte estado con ReelsController
    ▼
```

Ambos controladores pueden coexistir usando不同的 responsive keys:
- Reels: `'reels'`
- Cascade: `'cascade'`

---

## Patrones de Diseño

### EventEmitter

Todos los componentes que necesitan comunicar usan `Phaser.Events.EventEmitter`:

```javascript
// Componente emite
this.emit('eventName', data);

// Listener en GameController
component.on('eventName', (data) => { ... });
```

### Responsive

El sistema responsive usa `ResponsiveManager`:

```javascript
const config = ResponsiveManager.getForScene(this.scene)?.get('reels');
```

### Container Pattern

Los componentes UI usan containers de Phaser para agrupar elementos:

```javascript
this.container = this.scene.add.container(0, 0);
this.container.add([element1, element2]);
```
