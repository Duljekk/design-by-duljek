'use client';

import { useEffect } from 'react';
import { motion, useAnimate, useReducedMotion } from 'motion/react';
import type { Transition } from 'motion/react';
import { Logo } from './Logo';

/* ─────────────────────────────────────────────────────────
 * MORVA LABS — MOTION STORYBOARD
 *
 * Logo shine (continuous, loops — Figma 29:1587, node 29:1590):
 *    0ms    shine off top-left  (translate -distance,-distance)
 *  sweepMs  sweeps down-right to +distance,+distance  (cubic-bezier 0.19,1,0.22,1)
 *  loopMs   holds at +distance,+distance, then loops
 *
 * Driven imperatively via useAnimate, independent of the link's hover
 * variants — hovering the link would otherwise restart this loop from
 * 0 every time (Motion re-triggers keyframe animations on every variant
 * switch, even switching to an "equivalent" variant), which reads as
 * the shine replaying on hover in/out instead of running continuously.
 *
 * Streak is centered on the logo at translate 0, so the symmetric
 * sweep carries it corner-to-corner across the mark.
 *
 * Text underline (on hover):
 *    0ms    scaleX 0 → 1  (origin left, 0.8px, easeOut 300ms)
 * ───────────────────────────────────────────────────────── */

const UNDERLINE_TIMING = { duration: 0.3, ease: 'easeOut' } as const;

const SHINE_EASE = [0.19, 1, 0.22, 1] as const;

const SHINE = {
	distance: 14, // px the streak travels either side of centre
	sweepMs: 800, // sweep duration
	loopMs: 4000, // full cycle: sweep, then hold
} as const;

export function MorvaLabs() {
	const reduceMotion = useReducedMotion();
	const [shineScope, animateShine] = useAnimate<HTMLSpanElement>();

	const { distance, sweepMs, loopMs } = SHINE;

	useEffect(() => {
		if (reduceMotion) return;

		const shineTransition: Transition = {
			duration: loopMs / 1000,
			times: [0, sweepMs / loopMs, 1],
			ease: [SHINE_EASE, 'linear'],
			repeat: Infinity,
		};

		const controls = animateShine(
			shineScope.current,
			{ x: [-distance, distance, distance], y: [-distance, distance, distance] },
			shineTransition
		);

		return () => controls.stop();
	}, [reduceMotion, distance, sweepMs, loopMs, animateShine, shineScope]);

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
			className="group inline-flex items-center gap-1.5"
			initial="rest"
			animate="rest"
			whileHover="hover"
			whileFocus="hover"
		>
			<span className="relative inline-flex overflow-hidden rounded-full">
				<Logo size={18} alt="" />
				{!reduceMotion && (
					<span
						ref={shineScope}
						aria-hidden
						className="pointer-events-none absolute left-[7px] -top-[5px] h-7 w-1 -rotate-45 bg-white/60 blur-[2px]"
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
