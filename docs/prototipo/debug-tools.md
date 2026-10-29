# Debug Tools

Herramientas de debugging disponibles en el prototipo.

---

## Configuración

Las herramientas de debug se habilitan en `config.js`:

```javascript
// src/config/config.js
config.debug = true;
config.info = false;  // true para mostrar FPS, memoria, etc.
```

---

## Draggable Helper

Presiona `D` para togglear el modo draggable (solo cuando `config.debug: true`).

### Uso

1. Presiona `D`
2. Arrastra cualquier elemento UI a la posición deseada
3. Presiona `D` nuevamente para salir

### Implementación

**Archivo:** `src/utils/DraggableHelper.js`

```javascript
class DraggableHelper {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        // Crea overlay invisible para capturar drags
        this._createOverlay();
    }

    toggle() {
        this.active = !this.active;
        // Actualiza visualización
    }
}
```

### Agregar Elementos Draggables

Los elementos se agregan automáticamente siextenden `Phaser.GameObjects.Container` y tienen el método `setDraggable`.

---

## Stats Panel

Panel de estadísticas accesible desde el botón de stats en la botonera.

### Características

- **Session Tab:** Muestra sesión actual (balance, apuesta, total apostado, etc.)
- **Paytable Tab:** Lista de símbolos con sus payouts

### Implementación

**Archivo:** `src/utils/statsPanel/StatsPanel.js`

```javascript
class StatsPanel {
    constructor(scene, isOpen, isMobile, paytable) {
        // isOpen: si empieza abierto
        // isMobile: estilo mobile
        // paytable: datos de símbolos
    }

    open() { /* ... */ }
    close() { /* ... */ }
    toggle() { /* ... */ }
}
```

---

## Debug Panel (Legacy)

Panel de debug antiguo en `src/utils/debugPanel/`.

:::caution
Esta herramienta está en desuso. Usar DraggableHelper en su lugar.
:::

---

## DevTool

Herramienta de desarrollo para inspection de estado.

**Archivo:** `src/utils/devTool/DevTool.js`

---

## Info Overlay

Cuando `config.info: true`, se muestra overlay con:

- FPS actual
- Uso de memoria
- Estado del juego
- Número de objetos en escena

---

## Tips de Debug

### Logs de Consola

El código usa `console.log` para debugging:

```javascript
// En GameController.js
console.log(`TOTALBET: ${this.totalBet}, sidebet: ${sidebetName}, value: ${value}`);
```

### Breakpoints

Para inspeccionar estado en un momento específico:

```javascript
// En cualquier parte del código
debugger;  // Pausa la ejecución en este punto
```

### State Inspection

Para ver el estado actual del juego:

```javascript
// En la consola del navegador
window.game.state.getBalance()
window.game.state.getBet()
window.game.state.isAutoPlay()
```

---

## Archivo de Configuración

Para agregar nuevas herramientas de debug:

1. Crear clase en `src/utils/`
2. Inicializar en `GameController._createDevTools()`
3. Agregar toggle en keyboard shortcuts si es necesario
