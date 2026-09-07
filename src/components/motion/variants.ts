import type { Variants } from 'motion/react';

/* ─────────────────────────────────────────────────────────
 * ENTRANCE MOTION STORYBOARD
 *
 * Shared on-enter language for every section:
 *
 *    0ms   section fades in + slides up 24px  (gentle spring)
 *  120ms  each child staggers in, same fadeUp (staggerChildren)
 *
 * Springs (spring-first — no duration easing):
 *   gentle — sections & text   stiffness 300 / damping 30
 *   snappy — badges & pop-ins  stiffness 500 / damping 25
 * ───────────────────────────────────────────────────────── */

const SPRING = {
	gentle: { type: 'spring', stiffness: 300, damping: 30 },
	snappy: { type: 'spring', stiffness: 500, damping: 25 },
	/* Critically damped (damping ≈ 2√stiffness). For travel measured in single
	 * px, where any overshoot at all reads as a wobble rather than as life. */
	brisk: { type: 'spring', stiffness: 500, damping: 45 },
} as const;

const OFFSET_Y = 24; // px a layer slides up from
const STAGGER = 0.12; // s between staggered children

export const viewportOnce = { once: true } as const;

export const fadeUp: Variants = {
	hidden: { opacity: 0, y: OFFSET_Y },
	visible: { opacity: 1, y: 0, transition: SPRING.gentle },
};

export const fadeIn: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: SPRING.gentle },
};

export const popIn: Variants = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: { opacity: 1, scale: 1, transition: SPRING.snappy },
};

export const staggerContainer: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: STAGGER } },
};

/* Same cascade, held back one beat. For a layer that has to trigger on its own
 * viewport entry rather than inherit the section's — a tab panel, whose rows
 * are remounted on every press — but should still read as the section's second
 * act rather than starting in lockstep with the heading. */
export const staggerContainerDelayed: Variants = {
	hidden: {},
	visible: { transition: { delayChildren: STAGGER, staggerChildren: STAGGER } },
};

/* ─────────────────────────────────────────────────────────
 * SWAP MOTION — a list replaced in place (tab panels)
 *
 * Deliberately NOT the entrance language above. A scroll-in is a first
 * impression and can afford a 24px, 120ms-apart parade; a swap is a response to
 * a press, and the same treatment reads as the section reintroducing itself
 * long after the click. So: a third of the distance, a quarter of the gap
 * between rows — a ripple that has resolved before the pointer has moved.
 *
 *   0ms   every row starts hidden, 6px low
 *  35ms   between each row
 * ~330ms  last row settled
 * ───────────────────────────────────────────────────────── */

const SWAP_OFFSET_Y = 6; // px a swapped-in row rises from
const SWAP_STAGGER = 0.035; // s between swapped-in rows

export const swapContainer: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: SWAP_STAGGER } },
};

export const swapItem: Variants = {
	hidden: { opacity: 0, y: SWAP_OFFSET_Y },
	visible: { opacity: 1, y: 0, transition: SPRING.brisk },
};

/* Chat widget panel: grows up and out from the launcher corner.
 * Exit is a quick duration fade so closing feels immediate. */
export const chatPanel: Variants = {
	hidden: { opacity: 0, y: 16, scale: 0.97 },
	visible: { opacity: 1, y: 0, scale: 1, transition: SPRING.snappy },
	exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.14, ease: 'easeOut' } },
};
