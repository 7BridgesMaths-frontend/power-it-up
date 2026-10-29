# Keyboard Shortcuts

Atajos de teclado disponibles en el prototipo.

---

## Atajos Disponibles

| Tecla | Acción | Requerimiento |
|-------|--------|---------------|
| `Space` | Spin / Stop | - |
| `D` | Toggle Draggable Helper | `config.debug: true` |

---

## Space - Spin / Stop

El atajo de espacio funciona como botón Spin/Stop:

```
Sin spin activo → Inicia spin
Spin activo → Detiene reels
```

### Comportamiento Detallado

```javascript
// En GameController.js
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !event.repeat) {
        // 1. Blur cualquier elemento activo (input, etc.)
        if (document.activeElement?.blur) {
            document.activeElement.blur();
        }

        // 2. Si spin button está bloqueado, no hacer nada
        if (this.controls_bar?.spinButton?.spinButtonIsLocked) return;

        event.preventDefault();

        // 3. Si stop button visible → Stop
        if (stopContainer?.visible) {
            this.controls_bar?._onStopClick();
        }
        // 4. Si no está girando → Spin
        else if (!this.controls_bar?.isSpinning) {
            this.controls_bar?._onSpinClick();
        }
    }
});
```

### Estados del Spin

```
[Idle] ──Space──> [Spinning] ──Space──> [Stopping] ──> [Idle]
                            ↑
                            └───────── Space (stop visible)
```

---

## D - Draggable Helper (Debug Only)

Solo funciona cuando `config.debug: true` en `config.js`.

### Uso

1. Habilitar debug:
```javascript
// src/config/config.js
config.debug = true;
```

2. Presionar `D` para togglear el modo draggable.

3. En modo draggable, puedes arrastrar cualquier elemento UI para reposicionarlo.

4. Presionar `D` nuevamente para salir del modo.

### Archivos Involucrados

- `src/utils/DraggableHelper.js` - Sistema de drag
- `src/game/GameController.js` - Listener del atajo

---

## Agregar Nuevos Atajos

### 1. Agregar en GameController

```javascript
// En _createKeyboardShortcuts() o create()
this.input.keyboard.on('keydown-KEY', (event) => {
    // Tu lógica aquí
});
```

### 2. Consideraciones

- Usar `event.preventDefault()` si el atajo interfiere con browser defaults
- Verificar `!event.repeat` para evitar acciones repetidas
- Manejar el estado del juego (no responder durante animaciones si corresponde)
- Verificar `config.debug` para atajos de desarrollo

### Ejemplo

```javascript
// Agregar atajo de turbo
this.input.keyboard.on('keydown-T', (event) => {
    if (event.repeat) return;
    const isTurbo = this.state.getTurbo();
    this.state.setTurbo(!isTurbo);
    this.controls_bar.updateTurbo(!isTurbo);
});
```

---

## Phaser Key Events

Phaser maneja sus propios eventos de teclado. Para usarlos dentro de una escena:

```javascript
// En create()
this.input.keyboard.on('keydown-SPACE', () => {
    // ...
});
```

Para key codes disponibles, ver: [Phaser.Keyboard.KeyCodes](https://photonstorm.github.io/phaser3-docs/Phaser.Input.Keyboard.KeyCodes.html)
