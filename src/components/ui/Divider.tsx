'use client';

import { useDialKit } from 'dialkit';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';

/* ─────────────────────────────────────────────────────────
 * DIVIDER — DRAW STORYBOARD
 *
 * The 1px dashed line "draws" itself on left → right when it
 * scrolls into view. We reveal it with an animated clip-path
 * inset (right edge 100% → 0) instead of scaleX, so the dash
 * pattern (4px dash / 6px gap) never stretches while drawing.
 *
 *    0ms   waiting to scroll into view, line fully clipped
 *  delay   line starts drawing from the left edge
 *   draw   right clip travels 100% → 0%, revealing the line
 * ───────────────────────────────────────────────────────── */

const CLIP = {
	hidden: 'inset(0px 100% 0px 0px)', // fully clipped from the right (invisible)
	shown: 'inset(0px 0% 0px 0px)', // no clip (fully drawn)
} as const;

const DRAW = {
	duration: 0.95, // seconds for the line to draw across — slow, deliberate stroke
	delay: 0.05, // seconds before the draw begins
	ease: [0.22, 1, 0.36, 1] as const, // easeOutQuint — decelerates like a drawn stroke
};

const VIEWPORT = { once: true, margin: '-40px' as const }; // fire just before fully in view

export function Divider() {
	const reduceMotion = useReducedMotion();
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, VIEWPORT);

	const dial = useDialKit('Divider', {
		draw: {
			duration: [DRAW.duration, 0.2, 2],
			delay: [DRAW.delay, 0, 1],
		},
	});

	// Reproduces Figma's "Divider Frame" (12px gutter) + 1px dashed line (stone/200, 4px dash / 6px gap).
	return (
		<div ref={ref} className="px-3">
			<motion.div
				role="separator"
				className="h-px w-full bg-[repeating-linear-gradient(to_right,var(--color-stone-200)_0_4px,transparent_4px_10px)]"
				initial={{ clipPath: CLIP.hidden }}
				animate={{ clipPath: isInView || reduceMotion ? CLIP.shown : CLIP.hidden }}
				transition={
					reduceMotion
						? { duration: 0 }
						: { duration: dial.draw.duration, delay: dial.draw.delay, ease: DRAW.ease }
				}
			/>
		</div>
	);
}
