'use client';

import { motion, useReducedMotion } from 'motion/react';

/* ─────────────────────────────────────────────────────────
 * SOCIAL ICON — HOVER STORYBOARD
 *
 *   rest   32px slot, mark at its designed size, no backdrop
 *   hover  a stone-100 tile fades in behind the mark while the
 *          slot lifts 2px and scales up a touch
 *   leave  both settle back on the same spring
 *
 * The tile is a sibling layer rather than a background on the slot,
 * so it can fade independently of the lift and never repaints the
 * mark itself. Only transform/opacity animate — no layout work.
 * ───────────────────────────────────────────────────────── */

const LIFT = {
	y: -2, // px the slot rises on hover
	scale: 1.1,
	spring: { type: 'spring', stiffness: 500, damping: 25 },
} as const;

const TILE = { duration: 0.16, ease: 'easeOut' } as const;

interface Props {
	name: string;
	href: string;
	icon: string;
	iconWidth: number;
	iconHeight: number;
}

export function SocialIcon({ name, href, icon, iconWidth, iconHeight }: Props) {
	const reduceMotion = useReducedMotion();
	const isMail = href.startsWith('mailto:');

	return (
		<motion.a
			href={href}
			aria-label={name}
			{...(isMail ? {} : { target: '_blank', rel: 'noreferrer noopener' })}
			className="relative flex size-8 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
			initial="rest"
			whileHover="hover"
			whileFocus="hover"
			animate="rest"
			variants={{
				rest: { y: 0, scale: 1 },
				hover: reduceMotion ? { y: 0, scale: 1 } : { y: LIFT.y, scale: LIFT.scale },
			}}
			transition={reduceMotion ? { duration: 0 } : LIFT.spring}
		>
			<motion.span
				aria-hidden
				className="absolute inset-0 rounded-lg bg-stone-100"
				variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
				transition={reduceMotion ? { duration: 0 } : TILE}
			/>
			<img
				src={`/icons/social/${icon}`}
				alt=""
				width={iconWidth}
				height={iconHeight}
				loading="lazy"
				decoding="async"
				className="relative block"
				style={{ width: iconWidth, height: iconHeight }}
			/>
		</motion.a>
	);
}
