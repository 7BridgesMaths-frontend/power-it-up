import { gsap } from "gsap";

export function spinWinIn({ background, text, value }) {
    const counter = { value: 0 };

    return gsap.timeline()
        .set([background, text], { visible: true, alpha: 0 })
        .set(background, { scale: 1 })
        .set(text, { scale: 0.6 })
        .to([background, text], { scale: 1, alpha: 1, duration: 0.5, ease: 'power2.out' }, 0)
        .to(counter, {
            value: Number(value),
            duration: 0.8,
            ease: 'power2.out',
            onUpdate: () => text.setText("$" + counter.value.toFixed(2))
        }, 0);
}

export function spinWinOut({ background, text }) {
    return gsap.timeline()
        .to(background, { alpha: 0, duration: 0.5, ease: 'power2.out' }, 0)
        .to(text, { scale: 0.6, alpha: 0, duration: 0.5, ease: 'power2.out' }, 0);
}
