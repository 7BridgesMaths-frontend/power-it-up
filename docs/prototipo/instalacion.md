---
description: Cómo preparar el entorno de desarrollo e instalar el Prototipo Base de Slot.
sidebar_position: 0
---

# Instalación

Esta guía explica cómo preparar el entorno de desarrollo y ejecutar el **Prototipo Base** de forma local.

---

## Requisitos Previos

- [Visual Studio Code](https://code.visualstudio.com/) - Editor recomendado
- [Node.js](https://nodejs.org/) v22.22.3 o superior
- Git

---

## Clonar el Repositorio

```bash
git clone <repository-url>
cd proto-base
```

---

## Instalar Dependencias

```bash
npm install
```

---

## Ejecutar en Desarrollo

```bash
npm run dev
```

Esto levantará un servidor de desarrollo en [`http://localhost:8080`](http://localhost:8080).

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build de producción |

---

## Tecnologías

- **Phaser 3** - Motor de juegos 2D
- **Vite** - Bundler y servidor de desarrollo
- **JavaScript** - Lenguaje principal
