# Configuración

Referencia completa del archivo de configuración `src/config/config.js`.

---

## Estructura General

```javascript
export const config = {
    gameName: "TEMPLATE PROTOTIPO",
    slotType: "LINES",
    emojiFavicon: "🎰",
    version: "v0",
    info: false,

    availableBets: [...],
    balance: 10000,
    bet: 10,

    sidebets: [...],
    bigWins: [...],
    forcedPlays: [...],
    bonusBuy: [...],
    paytable: [...],

    waysWinningAnimation: {...},
    linesWinningAnimation: {...},

    grid: [...],
    reels: {...},
    reelsY: [...],
    reelsConfig: {...},

    symbolSize: 150,
    debug: false,
    background: {...},
    loadingScreen: {...},
    api: {...}
}
```

---

## Parámetros Generales

### `gameName`
**Tipo:** `string`
**Default:** `"TEMPLATE PROTOTIPO"`

Nombre del juego, usado en títulos y debugging.

### `slotType`
**Tipo:** `string`
**Valores:** `"LINES"` | `"WAYS"` | `"CLUSTER"`
**Default:** `"LINES"`

Define el tipo de slot:
- `LINES` - Líneas de pago tradicionales
- `WAYS` - Ganancias por símbolos adyacentes
- `CLUSTER` - Ganancias por grupos de símbolos

### `emojiFavicon`
**Tipo:** `string`
**Default:** `"🎰"`

Emoji que se muestra en el favicon del navegador.

### `version`
**Tipo:** `string`
**Default:** `"v0"`

Versión del juego para tracking.

### `info`
**Tipo:** `boolean`
**Default:** `false`

Si `true`, muestra información de debug en pantalla (FPS, memoria, etc.).

### `debug`
**Tipo:** `boolean`
**Default:** `false`

Si `true`, habilita:
- Panel de debug
- Herramienta Draggable (tecla `D`)
- Logs adicionales en consola

---

## Sistema de Apuestas

### `availableBets`
**Tipo:** `number[]`
**Default:** `[10, 20, 40, 60, 80, 100, 200, 300, 400, 500, 600, 800, 1000, 2000, 3000, 4000, 5000, 10000]`

Lista de apuestas disponibles en **centésimas de crédito** (10 = $0.10).

### `balance`
**Tipo:** `number`
**Default:** `10000`

Balance inicial en **centésimas de crédito**.

### `bet`
**Tipo:** `number`
**Default:** `10`

Apuesta inicial en **centésimas de crédito**.

---

## Side Bets

### `sidebets`
**Tipo:** `Array<{id: string, name: string, multiplier: number}>`

Lista de side bets disponibles.

```javascript
sidebets: [
    { id: 'double', name: '2x', multiplier: 2 },
    { id: 'super',  name: '5x', multiplier: 5 },
]
```

| Campo | Descripción |
|-------|-------------|
| `id` | Identificador único |
| `name` | Nombre a mostrar en UI |
| `multiplier` | Multiplicador del costo de spin |

:::note
El side bet **incrementa el costo del spin** pero **no afecta el payout**. El payout se calcula siempre sobre la apuesta base.
:::

:::important
El Bonus Buy se cobra sobre la **apuesta base**, sin el multiplicador del side bet. Esto está implementado en `GameState.chargeBonus()`.
:::

---

## Big Wins

### `bigWins`
**Tipo:** `Array<{type: string, multiplier: number}>`

Configuración de niveles de big win.

```javascript
bigWins: [
    { type: 'BIG WIN', multiplier: 25 },
    { type: 'MEGA WIN', multiplier: 50 },
]
```

| Campo | Descripción |
|-------|-------------|
| `type` | Nombre del nivel |
| `multiplier` | Multiplicador sobre la apuesta para activar |

---

## Bonus Buy

### `bonusBuy`
**Tipo:** `Array<BonusBuyConfig>`

Configuración de compras de bonus.

```javascript
bonusBuy: [
    {
        title: "Free Spins",
        description: "Enter to Free Spins",
        price: 100,
        type: "BB",
        priceType: "multiplier",
        texture: "sym_1"
    }
]
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `title` | `string` | Título del botón |
| `description` | `string` | Descripción |
| `price` | `number` | Precio en créditos o multiplicador |
| `type` | `string` | Identificador del bonus (ej: `"BB"`) |
| `priceType` | `"fixed"` \| `"multiplier"` | Cómo se interpreta el precio |
| `texture` | `string` | Textura del icono |

---

## Paytable

### `paytable`
**Tipo:** `Array<PaytableEntry>`

Configuración de símbolos y sus premios.

```javascript
paytable: [
    { id: 12, name: "WILD", texture: "sym_12", tier: "special", payouts: {}, special: "Substitutes..." },
    { id: 1,  name: "Poseidon", texture: "sym_1", tier: "high", payouts: { 3: 1.0, 4: 2.5, 5: 10, 6: 25 } },
]
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `number` | ID único del símbolo |
| `name` | `string` | Nombre |
| `texture` | `string` | Clave de la textura en el atlas |
| `tier` | `"special"` \| `"high"` \| `"mid"` \| `"low"` | Categoría del símbolo |
| `payouts` | `object` | Premiación por cantidad (keys: 3, 4, 5, 6...) |
| `special` | `string` | Texto especial (wild, scatter, etc.) |

---

## Grid y Reels

### `grid`
**Tipo:** `number[]`
**Ejemplo:** `[4, 4, 4, 4, 4, 4]`

Cantidad de filas visibles por reel. Ejemplo: slot 6x4.

### `reels`
**Tipo:** `object`
**Ejemplo:**
```javascript
reels: {
    r0: [1, 2, 3, 4],
    r1: [5, 6, 7, 8],
    // ...
}
```

Configuración de reels para el editor visual. Cada reel tiene un array de IDs de símbolos.

### `reelsY`
**Tipo:** `number[]`
**Default:** `[0, 0, 0, 0, 0, 0]`

Offset Y de cada reel.

### `reelsConfig`
**Tipo:** `object`

```javascript
reelsConfig: {
    x: 512,           // Posición X del grid
    y: 190,           // Posición Y del grid
    scaleX: 0.5,      // Escala horizontal
    scaleY: 0.5,      // Escala vertical
    gapBetweenReels: 0,
    gapBetweenRows: 0
}
```

Configuración de posición y escala del grid de reels.

### `symbolSize`
**Tipo:** `number`
**Default:** `150`

Tamaño base de los símbolos en pixels.

---

## Animaciones de Victoria

### `waysWinningAnimation`
**Tipo:** `object`

```javascript
waysWinningAnimation: {
    border: {
        visible: true,
        groupBySymbol: true
    },
    effects: ["pulse"],
    duration: 1000,
    delayBetweenWays: 200,
}
```

Configuración de animaciones para slots tipo WAYS.

### `linesWinningAnimation`
**Tipo:** `object`

```javascript
linesWinningAnimation: {
    effects: ["pulse"],
    duration: 1000,
    delayBetweenLines: 200,
}
```

Configuración de animaciones para slots tipo LINES.

---

## Background

### `background`
**Tipo:** `{key: string, path: string} | {key: null, path: null}`

```javascript
background: {
    key: 'bg_base',
    path: 'assets/images/ui/backgrounds/new-bg.png',
}
```

Para **deshabilitar** el background:
```javascript
background: {
    key: null,
    path: null,
}
```

---

## Loading Screen

### `loadingScreen`
**Tipo:** `object`

```javascript
loadingScreen: {
    test: false,      // Usa assets de test
    show: false,      // Muestra pantalla de carga
    showLogo: false   // Muestra logo
}
```

---

## API

### `api`
**Tipo:** `object`

```javascript
api: {
    baseUrl: 'https://api.playcasinoslots.xyz/api',
    username: 'landing',
    password: 'landing',
    secretId: 'uuid-del-juego',
    gameName: 'GatesOfPoseidon'
}
```

Configuración para conexión con backend de spins.

---

## Configuraciones Responsive

El juego tiene configuraciones responsive en:
- `src/config/desktop.config.js` - Posiciones para desktop
- `src/config/mobile.config.js` - Posiciones para mobile

这些 archivos definen posiciones X/Y de todos los elementos UI para cada plataforma.

---

## Tipado

El archivo `src/config/types.d.ts` contiene el tipado completo de la configuración para autocompletado en VS Code.
