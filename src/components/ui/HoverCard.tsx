'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { hoverCard } from '../motion/variants';

const VIEWPORT_PADDING = 8;

interface Props {
	children: ReactNode;
	/** `left` aligns to the anchor's leading edge, `center` centres over it. */
	align?: 'left' | 'center';
	className?: string;
}

/* Shared shell for hover overlays (project link previews, tool descriptions).
 *
 * Positioning lives on the outer element and motion on the inner one on
 * purpose: Motion writes `transform` inline, which would overwrite a
 * Tailwind `-translate-x-1/2` centring class. Splitting them keeps both. */
export function HoverCard({ children, align = 'left', className = '' }: Props) {
	const reduceMotion = useReducedMotion();
	const isCentered = align === 'center';

	const wrapper = useRef<HTMLDivElement>(null);
	const [nudge, setNudge] = useState(0);

	/* A card centred over an anchor near the window edge — the first or last
	 * tool, say — would hang off-screen, so slide it back into view.
	 *
	 * Corrections are relative to the current nudge and re-run whenever the
	 * card resizes, because the card grows once the webfont swaps in and a
	 * single measurement taken before that under-corrects. */
	useLayoutEffect(() => {
		const element = wrapper.current;
		if (!isCentered || !element) return;

		const clamp = () => {
			const { left, right } = element.getBoundingClientRect();
			const overflowLeft = VIEWPORT_PADDING - left;
			const overflowRight = right - (window.innerWidth - VIEWPORT_PADDING);

			if (overflowLeft > 0.5) setNudge((current) => current + overflowLeft);
			else if (overflowRight > 0.5) setNudge((current) => current - overflowRight);
		};

		clamp();

		const observer = new ResizeObserver(clamp);
		observer.observe(element);
		window.addEventListener('resize', clamp);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', clamp);
		};
	}, [isCentered]);

	return (
		<div
			ref={wrapper}
			style={nudge ? { marginLeft: `${nudge}px` } : undefined}
			className={`pointer-events-none absolute bottom-full z-20 mb-2 ${
				isCentered ? 'left-1/2 -translate-x-1/2' : 'left-3'
			}`}
		>
			<motion.div
				aria-hidden
				variants={hoverCard}
				initial="hidden"
				animate="visible"
				exit="exit"
				transition={reduceMotion ? { duration: 0 } : undefined}
				className={`overflow-hidden rounded-xl border border-stone-200 bg-bone-white shadow-lg ${
					isCentered ? 'origin-bottom' : 'origin-bottom-left'
				} ${className}`}
			>
				{children}
			</motion.div>
		</div>
	);
}
