import { SYMBOLS_TO_GROW, SYMBOLS_TO_SHAKE } from "../../constants/IDs";
import { SymbolView } from "../symbols";

const SPEED_TIME_SCALE = 5;
const OVERSHOOT_RATIO = 0.1;
const FALL_SEPARATION_RATIO = 1 / 3;

export default class CascadeSymbolView extends SymbolView {
    constructor({ scene, model, index, id, enterAnim = false, horizonalPos = false, symbolsPerReel, rowSpacing, reelsConfig }) {
        super({ scene, model, index, id, enterAnim, horizonalPos, reelsConfig });
        this.symbolsPerReel = symbolsPerReel;
        this.rowSpacing = rowSpacing ?? model.getSymbolSize() + model.getGapBetweenRows();
        this.symbolSize = reelsConfig?.symbolSize ?? model.getSymbolSize();
    }

    _getRowY(index) {
        return this.rowSpacing * index;
    }

    updateYPos(index) {
        this.container.y = this._getRowY(index);
    }

    forcePosY() {
        this.container.y = this._getRowY(this.index);
    }

    fallFromScreen(delay) {
        const currentY = this.container.y;
        const separationFactor = (this.index / this.symbolsPerReel) * this.symbolSize * FALL_SEPARATION_RATIO;
        const targetY = currentY + (this.rowSpacing * (this.symbolsPerReel + 1)) + (this.index * separationFactor);

        const timeScale = this.isQuickStop ? SPEED_TIME_SCALE : 1;

        return new Promise((resolve) => {
            this.fallingSymbolTween = this.scene.tweens.add({
                targets: this.container,
                persist: true,
                y: targetY,
                duration: 450,
                ease: 'Cubic.In',
                delay: delay,
                onComplete: () => {
                    this.fallingSymbolTween = null;
                    resolve();
                }
            });
            this.fallingSymbolTween.setTimeScale(timeScale);
        });
    }

    fallCascade(index) {
        this.index = index;

        const currentY = this.container.y;
        const targetY = this._getRowY(this.index);
        const distance = Math.abs(targetY - currentY);

        const timeScale = this.isQuickStop ? SPEED_TIME_SCALE : 1;

        const duration = 300 + (distance / this.rowSpacing) * 80;

        return new Promise((resolve) => {
            this.fallCascadeTween = this.scene.tweens.add({
                targets: this.container,
                y: targetY + this.symbolSize * OVERSHOOT_RATIO,
                ease: 'Cubic.In',
                duration: duration * 0.85,
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: this.container,
                        y: targetY,
                        ease: 'Back.Out',
                        duration: duration * 0.55,
                        onComplete: () => {
                            this.fallCascadeTween = null;
                            this.isQuickStop = false;
                            resolve();
                        }
                    });
                }
            });
            this.fallCascadeTween.setTimeScale(timeScale);
        });
    }

    animateDestroy() {
        return new Promise((resolve) => {
            let resolved = false;
            const safeResolve = () => {
                if (resolved) return;
                resolved = true;
                this.destroy();
                resolve();
            };

            this.tween = this.scene.tweens.add({
                targets: this.view,
                alpha: 0,
                scaleX: 1.3,
                scaleY: 1.3,
                ease: 'Expo.Out',
                duration: 300,
                onComplete: safeResolve
            });

            this.tween.once('stop', safeResolve);
            this.tween.once('destroy', safeResolve);

            this.scene.time.delayedCall(1000, safeResolve);
        });
    }

    makeWinner() {
        const border = new Phaser.GameObjects.Sprite(this.scene, 0, 0, 'symbols', 'border');
        border.x = this.view.displayWidth * 0.5;
        border.y = this.view.displayHeight * 0.5;
        this.container.add(border);

        return new Promise(resolve => {
            this.scene.tweens.add({
                targets: border,
                alpha: { from: 0, to: 1 },
                duration: 250,
                ease: 'Sine.InOut',
                repeat: 3,
                yoyo: true,
                onComplete: () => {
                    resolve();
                    border.destroy();
                }
            });
        });
    }

    stopSpin() {
        this.isQuickStop = true;
        if (this.fallTween) {
            this.fallTween.setTimeScale(SPEED_TIME_SCALE);
        }
        if (this.fallCascadeTween) {
            this.fallCascadeTween.setTimeScale(SPEED_TIME_SCALE);
        }
        if (this.fallingSymbolTween) {
            this.fallingSymbolTween.setTimeScale(SPEED_TIME_SCALE);
        }
    }

    fallFromAbove(delay, steps, cascade) {
        return new Promise(resolve => {
            const shakeSymbols = new Set(SYMBOLS_TO_SHAKE);
            const growSymbols = new Set(SYMBOLS_TO_GROW);

            let spinCount = steps / this.symbolsPerReel;
            const currentY = this.container.y;
            let targetY = this._getRowY(this.index);

            const baseDuration = 500 + (spinCount * this.index);
            const overshoot = this.symbolSize * OVERSHOOT_RATIO;

            const timeScale = this.isQuickStop ? SPEED_TIME_SCALE : 1;

            if (shakeSymbols.has(this.id)) {
                this.shakeAnimation({
                    delay: baseDuration,
                    strength: 10
                });
            }

            if (growSymbols.has(this.id)) {
                this.growAnimation(baseDuration, 0.20);
            }

            this.fallTween = this.scene.tweens.chain({
                targets: this.container,
                tweens: [
                    {
                        y: targetY + overshoot,
                        duration: baseDuration * 0.85,
                        ease: 'Cubic.In'
                    },
                    {
                        y: targetY,
                        duration: baseDuration * 0.55,
                        ease: 'Back.Out',
                        easeParams: [0.5]
                    }
                ],
                delay: delay,
                onComplete: () => {
                    this.fallTween = null;
                    this.isQuickStop = false;
                    resolve();
                }
            });

            this.fallTween.setTimeScale(timeScale);
        });
    }
}
