# Diseño Responsive

El prototipo soporta desktop y mobile con configuraciones separadas.

---

## Estructura de Configuraciones

```
src/config/
├── config.js              # Configuración general del juego
├── desktop.config.js      # Posiciones para desktop
└── mobile.config.js       # Posiciones para mobile
```

---

## Detección de Plataforma

La detección se realiza en `ResponsiveManager`:

```javascript
// src/core/ResponsiveManager.js
isMobileView() {
    return window.matchMedia('(max-width: 768px)').matches ||
           navigator.maxTouchPoints > 0;
}
```

El viewport se determina al iniciar y se guarda para la sesión.

---

## Configuraciones Disponibles

### desktop.config.js

Configuraciones para pantallas grandes (> 768px).

### mobile.config.js

Configuraciones para pantallas pequeñas (≤ 768px) y táctiles.

---

## Cómo Modificar Posiciones

### 1. Editar el archivo de configuración

**Desktop:** `src/config/desktop.config.js`
```javascript
export const desktopConfig = {
    controls: {
        spin: { x: 512, y: 620 },
        balance: { x: 70, y: 70 },
        // ...
    },
    ui: {
        background: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        // ...
    }
}
```

**Mobile:** `src/config/mobile.config.js`
```javascript
export const mobileConfig = {
    controls: {
        spin: { x: 160, y: 520 },
        balance: { x: 50, y: 50 },
        // ...
    },
    ui: {
        background: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        // ...
    }
}
```

### 2. Aplicar en Componentes

Los componentes leen las posiciones así:

```javascript
// En el constructor de cada componente
const pos = (key) => ResponsiveManager.getForScene(this.scene)?.get(key) || {};
const { x, y } = pos('spin');
container.setPosition(x, y);
```

### 3. Método `applyResponsive`

Phaser objects tienen un método helper:

```javascript
sprite.applyResponsive('ui.background');
// Equivale a:
// sprite.setPosition(config.ui.background.x, config.ui.background.y);
// sprite.setScale(config.ui.background.scaleX, config.ui.background.scaleY);
```

---

## Diferencias Desktop vs Mobile

| Elemento | Desktop | Mobile |
|----------|---------|--------|
| **Spin Button** | 80px radio | 80px radio |
| **Stats Button** | 40px | 50px |
| **Controls Group** | Vertical, 40px | Horizontal, 50px |
| **Auto Play Panel** | 140x55px | 110x70px |
| **Bet Selector** | Panel lateral | Panel inferior |
| **Layout** | Horizontal | Vertical |

---

## Agregar Nuevas Posiciones

### 1. Definir en ambos archivos

**desktop.config.js:**
```javascript
export const desktopConfig = {
    myFeature: {
        x: 400,
        y: 300,
        scaleX: 1,
        scaleY: 1
    }
}
```

**mobile.config.js:**
```javascript
export const mobileConfig = {
    myFeature: {
        x: 200,
        y: 250,
        scaleX: 0.8,
        scaleY: 0.8
    }
}
```

### 2. Agregar al mapa de conversión

En `ResponsiveManager.js`, agregar la clave al mapa `responsiveConfig`:

```javascript
const responsiveConfig = {
    desktop: {
        ...desktopConfig,
        myFeature: desktopConfig.myFeature
    },
    mobile: {
        ...mobileConfig,
        myFeature: mobileConfig.myFeature
    }
}
```

### 3. Usar en el componente

```javascript
const pos = (key) => ResponsiveManager.getForScene(this.scene)?.get(key) || {};
const { x, y, scaleX, scaleY } = pos('myFeature');

const mySprite = this.scene.add.sprite(x, y, 'myTexture');
mySprite.setScale(scaleX, scaleY);
```

---

## Debugging Responsive

### Ver Configuración Actual

En modo debug (`config.debug: true`), presiona `D` para activar el DraggableHelper y arrastrar elementos visualmente.

### Log de Posiciones

```javascript
const pos = (key) => {
    const p = ResponsiveManager.getForScene(this.scene)?.get(key);
    console.log(`${key}:`, p);
    return p || {};
};
```

---

## Tips

- **Testear siempre en ambos tamaños** de pantalla
- **Usar valores relativos** cuando sea posible en lugar de hardcodear
- **Mobile first** puede ser útil para interfaces táctiles grandes
- **Revisar aspect ratio** - el juego puede verse diferente en 16:9 vs 9:16
