'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { Transition } from 'motion/react';
import { Logo } from './Logo';

/* ─────────────────────────────────────────────────────────
 * MORVA LABS — MOTION STORYBOARD
 *
 * Logo shine (continuous, loops every 2s — Figma 29:1587):
 *    0ms    shine rests top-left
 *  400ms   sweeps 20px down-right  (cubic-bezier 0.19,1,0.22,1)
 * 2000ms   holds, then loops
 *
 * Text underline (on hover):
 *    0ms    scaleX 0 → 1  (origin left, 0.8px, easeOut 300ms)
 * ───────────────────────────────────────────────────────── */

const UNDERLINE_TIMING = { duration: 0.3, ease: 'easeOut' } as const;

const SHINE_KEYFRAMES = { x: [0, 20, 20], y: [0, 20, 20] };

const SHINE_TRANSITION: Transition = {
	duration: 2,
	times: [0, 0.2, 1],
	ease: [[0.19, 1, 0.22, 1], 'linear'],
	repeat: Infinity,
};

export function MorvaLabs() {
	const reduceMotion = useReducedMotion();

	const underline = {
		rest: { scaleX: 0 },
		hover: {
			scaleX: 1,
			transition: reduceMotion ? { duration: 0 } : UNDERLINE_TIMING,
		},
	};

	return (
		<motion.a
			href="https://morvalabs.com"
			target="_blank"
			rel="noopener noreferrer"
			className="group inline-flex items-center gap-2"
			initial="rest"
			animate="rest"
			whileHover="hover"
			whileFocus="hover"
		>
			<span className="relative inline-flex overflow-hidden rounded-full">
				<Logo size={18} alt="" />
				{!reduceMotion && (
					<motion.span
						aria-hidden
						className="pointer-events-none absolute -left-4 -top-4 h-7 w-1 -rotate-45 bg-white/60 blur-[2px]"
						animate={SHINE_KEYFRAMES}
						transition={SHINE_TRANSITION}
					/>
				)}
			</span>
			<span className="relative font-medium text-stone-800">
				Morva Labs
				<motion.span
					aria-hidden
					variants={underline}
					className="absolute inset-x-0 bottom-0.5 h-[0.8px] origin-left bg-stone-800"
				/>
			</span>
		</motion.a>
	);
}
