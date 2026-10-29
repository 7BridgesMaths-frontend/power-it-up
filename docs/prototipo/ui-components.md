# UI Components

Referencia de los componentes de UI del prototipo.

---

## Estructura de Componentes

```
src/ui/components/
├── SpinButton.js          # Botón Spin/Stop
├── StatsButton.js         # Botón de estadísticas
├── TurboButton.js        # Botón de turbo
├── SideBetButton.js      # Botón cíclico de side bet
├── ControlsGroup.js      # Grupo de controles (mute, fullscreen)
├── ValuesDisplay.js      # Display de balance/ganancias/apuesta
├── BetSelector.js        # Selector de apuesta (sin side bets)
├── BetButton.js          # Botón genérico de apuesta
├── AutoPlayPanel.js      # Panel y control de auto play
├── BonusBuyPanel.js      # Panel de compra de bonus
└── ForcedPlaySelector.js # Selector de jugadas forzadas
```

---

## SpinButton

**Ubicación:** `src/ui/components/SpinButton.js`

Botonera principal de spin/stop.

### API

```javascript
const spinButton = new SpinButton({
    scene: this,
    onSpinClick: () => this._onSpinClick(),
    onStopClick: () => this._onStopClick(),
    config: {
        radius: 80,        // Radio del botón
        iconSize: 120,     // Tamaño del icono spin
        stopIconSize: 96   // Tamaño del icono stop
    }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `enableSpin()` | Habilita botón spin, desbloquea `spinButtonIsLocked` |
| `disableSpin()` | Deshabilita botón spin, bloquea `spinButtonIsLocked` |
| `enableStop()` | Habilita botón stop |
| `disableStop()` | Deshabilita botón stop |
| `showSpin()` | Muestra botón spin, oculta stop |
| `hideSpin()` | Oculta botón spin |
| `showStop()` | Muestra botón stop, oculta spin |
| `hideStop()` | Oculta botón stop |
| `getSpinContainer()` | Retorna container del botón spin |
| `getStopContainer()` | Retorna container del botón stop |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `spinButtonIsLocked` | `boolean` | Flag que bloquea clicks en spin |

---

## BetSelector

**Ubicación:** `src/ui/components/BetSelector.js`

Maneja la selección de apuesta. **Nota:** Los side bets ahora se manejan independientemente por `SideBetButton`.

### API

```javascript
const betSelector = new BetSelector({
    scene: this,
    onBetChange: (value) => console.log('Bet:', value),
    bet: 100,              // Apuesta inicial en créditos
    availableBets: [10, 20, 40, 60, 80, 100, 200],
    config: { /* configuraciones responsive */ }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `openPanel()` | Abre el panel de selección |
| `closePanel()` | Cierra el panel |
| `setTotalBet(value)` | Setea la apuesta total |
| `setSideBetMultiplier(multiplier)` | Actualiza multiplicador de side bet (1 = sin sidebet) |
| `setSideBetActive(isActive)` | Actualiza estado visual de side bet (borde amarillo) |
| `enable()` | Habilita interactividad |
| `disable()` | Deshabilita interactividad |
| `getContainer()` | Retorna container principal |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `totalBet` | `number` | Apuesta total actual (en dólares) |
| `baseBet` | `number` | Apuesta base sin side bet |
| `currentMultiplier` | `number` | Multiplicador de side bet activo |
| `sideBetMultiplier` | `number` | Multiplicador de side bet (para cálculos de panel) |
| `isPanelOpen` | `boolean` | Si el panel está abierto |

---

## AutoPlayPanel

**Ubicación:** `src/ui/components/AutoPlayPanel.js`

Control de auto spin.

### API

```javascript
const autoPlayPanel = new AutoPlayPanel({
    scene: this,
    onAutoPlay: (rounds) => console.log('Auto play:', rounds),
    onStopAutoPlay: () => console.log('Stop auto play'),
    config: {
        hideLabel: false,
        size: 'desktop'  // o 'mobile'
    }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `openPanel()` | Abre panel de selección de rondas |
| `closePanel()` | Cierra panel |
| `showStopAutoPlay(rounds)` | Muestra botón de detener |
| `hideStopAutoPlay()` | Oculta botón detener |
| `enable()` | Habilita interactividad |
| `disable()` | Deshabilita interactividad |
| `getContainer()` | Retorna container |

### Constantes de Rondas

```javascript
// src/constants/UICoordinates.js
AUTOPLAY_BUTTONS = [5, 10, 25, 50, 75, 100, 500]
```

---

## BonusBuyPanel

**Ubicación:** `src/ui/components/BonusBuyPanel.js`

Panel de compra de bonus.

### API

```javascript
const bonusBuyPanel = new BonusBuyPanel({
    scene: this,
    onBonusBuy: (bonusInfo) => console.log('Bonus buy:', bonusInfo),
    bonusOptions: [
        { title: "Free Spins", price: 100, type: "BB" },
        { title: "Super Free Spins", price: 200, type: "BB2" }
    ],
    config: {
        size: 'desktop'  // o 'mobile'
    }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `show()` | Muestra el panel |
| `hide()` | Oculta el panel |
| `enable()` | Habilita interactividad |
| `disable()` | Deshabilita interactividad |
| `getContainer()` | Retorna container |

---

## ValuesDisplay

**Ubicación:** `src/ui/components/ValuesDisplay.js`

Display de balance, ganancias y apuesta.

### API

```javascript
const valuesDisplay = new ValuesDisplay({
    scene: this,
    config: {
        size: 'desktop'
    }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `updateBalance(value)` | Actualiza balance |
| `updateWin(value)` | Actualiza ganancias |
| `updateBet(value)` | Actualiza apuesta |
| `getContainer()` | Retorna container |

---

## StatsButton

**Ubicación:** `src/ui/components/StatsButton.js`

Botón para abrir/cerrar el panel de estadísticas.

### API

```javascript
const statsButton = new StatsButton({
    scene: this,
    onClick: () => statsPanel.toggle(),
    config: { size: 'desktop' }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `getContainer()` | Retorna container |

### Tamaño

- **Desktop:** 40px
- **Mobile:** 50px

---

## TurboButton

**Ubicación:** `src/ui/components/TurboButton.js`

Botón para activar/desactivar modo turbo.

### API

```javascript
const turboButton = new TurboButton({
    scene: this,
    onToggle: (isTurbo) => console.log('Turbo:', isTurbo),
    config: { size: 'desktop' }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `getContainer()` | Retorna container |

---

## SideBetButton

**Ubicación:** `src/ui/components/SideBetButton.js`

Botón cíclico de side bet. Cada click cyclea entre las opciones de side bet disponibles y finalmente se apaga.

### API

```javascript
const sideBetButton = new SideBetButton({
    scene: this,
    onToggle: (isSideBet, sideBet) => console.log('Sidebet:', isSideBet, sideBet),
    sideBets: [
        { id: 'double', name: 'SB x2', multiplier: 2 },
        { id: 'super', name: 'Super SB 5x', multiplier: 5 }
    ],
    isMobile: false
});
```

### Estructura de sideBet

```javascript
{
    id: 'string',      // Identificador único
    name: 'string',    // Nombre para mostrar (ej: "SB x2")
    multiplier: number  // Multiplicador (ej: 2 para apuesta x2)
}
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `toggle()` | Cyclea a la siguiente opción de side bet |
| `setActive(value)` | Activa/desactiva el side bet programáticamente |
| `enable()` | Habilita interactividad |
| `disable()` | Deshabilita interactividad |
| `getContainer()` | Retorna container |
| `getCurrentSideBet()` | Retorna el side bet activo o `null` |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `sideBet` | `boolean` | Si hay un side bet activo |
| `currentIndex` | `number` | Índice actual en el array de side bets |
| `hasSideBet` | `boolean` | Si hay opciones de side bet disponibles |

### Comportamiento Cíclico

```
OFF → SB x2 → Super SB 5x → OFF → SB x2 → ...
```

- **OFF**: `sideBet = false`, `currentIndex = -1`
- **SB x2**: `sideBet = true`, `currentIndex = 0`, multiplicador = 2
- **Super SB 5x**: `sideBet = true`, `currentIndex = 1`, multiplicador = 5

### Estados Visuales

- **Sin side bet**: Texto "$" en blanco, label "SIDE BET"
- **Con side bet**: Texto "2x" o "5x" en amarillo, label con nombre del side bet
- **Hover**: Escala 0.96 con tween

### Eventos

El callback `onToggle` recibe:
- `isSideBet`: `boolean` - si el side bet está activo
- `sideBet`: `object | null` - el objeto de side bet activo o `null`

### Integración con GameController

```javascript
// En GameController
this.controls_bar.on('setSideBet', (isSideBet, sideBet) => {
    const multiplier = sideBet ? sideBet.multiplier : 1;
    this.state.setSideBet(isSideBet, sideBet);
    this.controls_bar.betSelector.setSideBetMultiplier(multiplier);
    this.state.setTotalBet(this.state.getBaseBet());
});
```

---

## ControlsGroup

**Ubicación:** `src/ui/components/ControlsGroup.js`

Grupo de botones: Mute y Fullscreen.

### API

```javascript
const controlsGroup = new ControlsGroup({
    scene: this,
    config: { size: 'desktop' }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `getContainer()` | Retorna container |

### Tamaño

- **Desktop:** 40px (vertical)
- **Mobile:** 50px (horizontal)

---

## BetButton

**Ubicación:** `src/ui/components/BetButton.js`

Botón genérico de apuesta usado en el panel de selección.

### API

```javascript
const betButton = new BetButton({
    scene: this,
    value: 100,
    isSelected: false,
    onClick: () => console.log('Clicked:', value)
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `setSelected(bool)` | Marca/desmarca como seleccionado |
| `getContainer()` | Retorna container |

---

## ForcedPlaySelector

**Ubicación:** `src/ui/components/ForcedPlaySelector.js`

Selector de jugadas forzadas para testing.

### API

```javascript
const forcedPlaySelector = new ForcedPlaySelector({
    scene: this,
    onSelect: (spinType) => console.log('Selected:', spinType),
    forcedPlays: [
        { label: 'Random', spinType: 'basegame' },
        { label: 'Single Play', spinType: 'file-singlePlay' }
    ],
    config: { size: 'desktop' }
});
```

### Métodos

| Método | Descripción |
|--------|-------------|
| `getContainer()` | Retorna container |

---

## Crear Nuevos Componentes

Para crear un nuevo componente:

1. **Crear el archivo** en `src/ui/components/NombreComponente.js`

2. **Extender de EventEmitter** si necesita emitir eventos:

```javascript
import { EventEmitter } from 'eventemitter3';

export default class MiComponente extends EventEmitter {
    constructor({ scene, onAction, config = {} }) {
        super();
        this.scene = scene;
        this.onAction = onAction;
        this.config = config;
        this.container = this._create();
    }

    _create() {
        const container = this.scene.add.container(0, 0);
        // ... crear elementos gráficos
        return container;
    }

    enable() {
        // ... habilitar interactividad
    }

    disable() {
        // ... deshabilitar interactividad
    }

    getContainer() {
        return this.container;
    }
}
```

3. **Exportar** en `src/ui/components/index.js`:

```javascript
export { default as MiComponente } from './MiComponente';
```

4. **Importar en UIControlsBar** y usar en `_createButtons()`.

---

## Patrones de Diseño

### Interactividad

Todos los componentes interactivos deben tener:

```javascript
// Habilitar
component.getContainer().setAlpha(1);
component.getContainer().setInteractive({ /* configuración */ });

// Deshabilitar
component.getContainer().setAlpha(0.5);
component.getContainer().disableInteractive();
```

### Posicionamiento

Usar `config` para posiciones responsive:

```javascript
const pos = (key) => ResponsiveManager.getForScene(this.scene)?.get(key) || { x: 0, y: 0 };
const { x, y } = pos('myComponent');
container.setPosition(x, y);
```

### Eventos

Usar EventEmitter para comunicación:

```javascript
// En componente
this.emit('action', { data: 'value' });

// En consumidor
component.on('action', (data) => console.log(data));
```
