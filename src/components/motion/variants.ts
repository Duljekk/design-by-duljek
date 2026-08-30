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

/* Hover link-preview card: pops up from just below its resting spot.
 * Exit is duration-based so the card clears quickly when the pointer
 * leaves, rather than settling on a spring. */
export const hoverCard: Variants = {
	hidden: { opacity: 0, y: 6, scale: 0.97 },
	visible: { opacity: 1, y: 0, scale: 1, transition: SPRING.snappy },
	exit: { opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.12, ease: 'easeOut' } },
};

/* Chat widget panel: grows up and out from the launcher corner.
 * Like hoverCard, exit is a quick duration fade so closing feels immediate. */
export const chatPanel: Variants = {
	hidden: { opacity: 0, y: 16, scale: 0.97 },
	visible: { opacity: 1, y: 0, scale: 1, transition: SPRING.snappy },
	exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.14, ease: 'easeOut' } },
};
