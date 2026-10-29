---
sidebar_label: 'Introducción'
sidebar_position: 0
slug: /
---

# Introducción

Proto-base-reels es un prototipo base de slot machine desarrollado por 7Bridges. Proporciona una arquitectura modular y reutilizable para crear juegos de casino tipo slot.

---

## Características Principales

- **Sistema de reels vertical** con animaciones de spin
- **Cascadas (Avalanche/Cascade)** para mecánicas de respin
- **Sistema de sidebets** con multiplicadores
- **Bonus Buy** integrado
- **Auto Play** configurable
- **Responsive** para desktop y mobile
- **Configuración por JSON** para datos de jugadas

---

## Estructura del Proyecto

```
proto-base-reels/
├── src/
│   ├── config/           # Configuraciones del juego
│   ├── constants/        # Constantes globales
│   ├── core/             # Model, ResponsiveManager, State
│   ├── features/
│   │   ├── reels/        # Controlador de reels
│   │   └── cascade/      # Controlador de cascadas
│   ├── game/             # GameController, GameState
│   ├── ui/
│   │   ├── components/   # Componentes UI
│   │   └── UIControlsBar.js
│   └── utils/            # Helpers, debug tools
├── public/
│   └── assets/           # Sprites, sonidos, fonts
└── docs/                 # Esta documentación
```

---

## Conceptos Clave

### Apuesta (Bet)

El sistema de apuestas maneja dos valores:
- **baseBet**: Apuesta base sin multiplicadores
- **totalBet**: Apuesta total incluyendo sidebets

Ejemplo con sidebet x2:
- baseBet = 10 centavos
- sideBetMultiplier = 2
- totalBet = 20 centavos

### Side Bet

El side bet es un multiplicador opcional que:
- **Cuesta más** por spin
- **No afecta el payout** (ganancias calculadas sobre apuesta base)
- Se maneja de forma **independiente** del BetSelector
- El botón `SideBetButton` permite cyclic entre opciones

### Cascade/Avalanche

Cuando hay ganancias, los símbolos winners desaparecen y nuevos símbolos caen desde arriba. Cada cascada puede generar nuevas ganancias.

### Bonus Buy

Permite comprar acceso directo a bonus/freespins. El costo se calcula sobre la **apuesta base** (sin sidebet).

---

## Tecnologías

- **Phaser 3** - Motor de juego 2D
- **Vanilla JavaScript** - Sin frameworks adicionales
- **DOM Elements** - Para UI compleja (stats panel)
- **ResponsiveManager** - Sistema de configuración responsive

---

## Uso

```bash
# Instalación
npm install

# Desarrollo
npm run dev

# Build producción
npm run build
```

---

## Mantenimiento

Esta documentación debe mantenerse actualizada junto con el código. Cualquier cambio significativo en:
- Arquitectura
- Componentes
- Flujo de spin
- Configuración

Debe reflejarse en los archivos correspondientes de `/docs`.
