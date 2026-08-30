'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Shot } from '../../lib/projects';

interface Props {
	shots: Shot[];
}

/* Direction-aware slide variants. `custom` carries the travel direction
 * (+1 next, -1 previous); the incoming shot enters from the side it travels
 * from and the outgoing one leaves out the opposite side. */
const slideVariants = {
	enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%' }),
	center: { x: '0%' },
	exit: (direction: number) => ({ x: direction > 0 ? '-100%' : '100%' }),
};

/* Non-website project overlay content — a Dribbble-shot carousel (Figma node
 * 61:1548). The card shell is provided by ProjectList; this renders the 432px
 * image frame (rounded 6px, the Figma ring-and-drop shadow) whose image links
 * out to its Dribbble shot, plus a row of page-indicator dots overlaid near
 * the bottom.
 *
 * The dots ARE the navigation (the spec has no arrows): the active dot is a
 * stone-400 pill, inactive ones are stone-200 circles, each in a 24px touch
 * target. Index starts at 0, so with no "previous" the leftmost dot is
 * active, and on the last slide the rightmost is active.
 *
 * Switching shots slides the image horizontally:
 *   next     → new shot enters from the right, moving left
 *   previous → new shot enters from the left, moving right
 * Inactive dots lighten to stone-300 on hover. */
export function ShotCard({ shots }: Props) {
	const reduceMotion = useReducedMotion();
	const [[index, direction], setSlide] = useState<[number, number]>([0, 0]);

	const current = shots[index];
	if (!current) return null;

	const goTo = (i: number) => {
		if (i === index) return;
		setSlide([i, i > index ? 1 : -1]);
	};

	const transition = reduceMotion
		? { duration: 0 }
		: { type: 'spring', stiffness: 300, damping: 30 };

	return (
		<div className="w-[464px]">
			<div className="relative p-4">
				<div
					className="relative w-[432px] overflow-hidden rounded-[6px] bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_3px_6px_-3px_rgba(0,0,0,0.1)]"
					style={{ aspectRatio: `${current.width} / ${current.height}` }}
				>
					<AnimatePresence initial={false} custom={direction}>
						<motion.div
							key={index}
							custom={direction}
							variants={slideVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={transition}
							className="absolute inset-0"
						>
							{current.href ? (
								<a
									href={current.href}
									target="_blank"
									rel="noopener noreferrer"
									className="block size-full"
								>
									<img
										src={current.src}
										srcSet={current.srcSet}
										alt={current.alt}
										width={current.width}
										height={current.height}
										loading="lazy"
										decoding="async"
										className="size-full object-cover"
									/>
								</a>
							) : (
								<div className="block size-full">
									<img
										src={current.src}
										srcSet={current.srcSet}
										alt={current.alt}
										width={current.width}
										height={current.height}
										loading="lazy"
										decoding="async"
										className="size-full object-cover"
									/>
								</div>
							)}
						</motion.div>
					</AnimatePresence>
				</div>

				{shots.length > 1 && (
					<div className="absolute bottom-[31px] left-1/2 flex -translate-x-1/2 items-center">
						{shots.map((shot, i) => (
							<button
								key={shot.src}
								type="button"
								onClick={() => goTo(i)}
								aria-label={`Show image ${i + 1} of ${shots.length}`}
								aria-current={i === index}
								className="group/dot flex size-6 items-center justify-center"
							>
								<span
									className={
										i === index
											? 'h-1.5 w-3.5 rounded-full bg-stone-400'
											: 'size-1.5 rounded-full bg-stone-200 transition-colors group-hover/dot:bg-stone-300'
									}
								/>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
