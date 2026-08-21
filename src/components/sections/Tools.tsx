'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SectionHeading } from '../ui/SectionHeading';
import { ToolItem } from '../ui/ToolItem';
import { ToolCard } from '../ui/ToolCard';
import { tools } from '../../lib/tools';
import { useCanHover } from '../../lib/useCanHover';
import { fadeUp, popIn, staggerContainer, viewportOnce } from '../motion/variants';

/* ─────────────────────────────────────────────────────────
 * TOOLS — SHARED HOVER CARD STORYBOARD
 *
 * One card is shared by every tool. Moving between tools never
 * re-enters it; the same card travels sideways and warps its
 * width to fit the new label.
 *
 *  idle    nothing hovered — no card
 *  enter   first hover: card fades up into place
 *  move    another tool: card slides X + warps width  (no re-entry)
 *  leave   pointer exits the row: card fades out
 * ───────────────────────────────────────────────────────── */

const CARD = {
	edgePadding: 8, // px kept between card and window edge
	hiddenY: 4, // px below its resting spot while hidden
	hiddenScale: 0.96, // scale while hidden
	travel: { type: 'spring', stiffness: 420, damping: 36 }, // slide between tools
	warp: { type: 'spring', stiffness: 460, damping: 38 }, // width/height morph
	fade: { duration: 0.14, ease: 'easeOut' }, // first show / final hide
	label: { duration: 0.12, ease: 'easeOut' }, // name swap
} as const;

interface Anchor {
	centerX: number; // hovered icon's centre, relative to the row
	rowLeft: number; // row's offset in the viewport
	viewportWidth: number;
}

export function Tools() {
	const reduceMotion = useReducedMotion();
	const canHover = useCanHover();

	const rowRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
	const cardRef = useRef<HTMLDivElement>(null);

	const [active, setActive] = useState<number | null>(null);
	const [anchor, setAnchor] = useState<Anchor | null>(null);
	const [cardWidth, setCardWidth] = useState(0);

	/* The card's width drives edge-clamping, and it changes as labels swap
	 * and when the webfont loads — so track it rather than measuring once. */
	useLayoutEffect(() => {
		const element = cardRef.current;
		if (!element) return;

		const sync = () => setCardWidth(element.getBoundingClientRect().width);
		sync();

		const observer = new ResizeObserver(sync);
		observer.observe(element);
		return () => observer.disconnect();
	}, [active]);

	const pointAt = (index: number) => {
		const row = rowRef.current;
		const item = itemRefs.current[index];
		if (!row || !item) return;

		const rowBox = row.getBoundingClientRect();
		const itemBox = item.getBoundingClientRect();

		setAnchor({
			centerX: itemBox.left - rowBox.left + itemBox.width / 2,
			rowLeft: rowBox.left,
			viewportWidth: window.innerWidth,
		});
		setActive(index);
	};

	/* Centre the card on the tool, but never let it hang off the window. */
	const targetX = (() => {
		if (!anchor) return 0;
		const half = cardWidth / 2;
		const min = CARD.edgePadding + half - anchor.rowLeft;
		const max = anchor.viewportWidth - CARD.edgePadding - half - anchor.rowLeft;
		return Math.min(Math.max(anchor.centerX, min), Math.max(min, max));
	})();

	const tool = active === null ? null : tools[active];

	return (
		<motion.section
			className="flex flex-col gap-3.5 px-3"
			variants={staggerContainer}
			initial={reduceMotion ? 'visible' : 'hidden'}
			whileInView="visible"
			viewport={viewportOnce}
		>
			<motion.div variants={fadeUp}>
				<SectionHeading title="Tools">What I use to design, build, and experiment.</SectionHeading>
			</motion.div>

			<motion.div
				className="relative"
				variants={staggerContainer}
				onPointerLeave={() => setActive(null)}
			>
				<div ref={rowRef} className="flex [&>*+*]:-ml-2">
					{tools.map((item, index) => (
						<motion.div
							key={`${item.name}-${index}`}
							ref={(element) => {
								itemRefs.current[index] = element;
							}}
							variants={popIn}
							onPointerEnter={() => pointAt(index)}
						>
							<ToolItem {...item} />
						</motion.div>
					))}
				</div>

				<AnimatePresence>
					{canHover && tool && (
						<motion.div
							aria-hidden
							className="pointer-events-none absolute bottom-full left-0 z-20 mb-2"
							initial={{ x: targetX, y: CARD.hiddenY, opacity: 0, scale: CARD.hiddenScale }}
							animate={{ x: targetX, y: 0, opacity: 1, scale: 1 }}
							exit={{ y: CARD.hiddenY, opacity: 0, scale: CARD.hiddenScale }}
							transition={
								reduceMotion
									? { duration: 0 }
									: { x: CARD.travel, default: CARD.fade }
							}
						>
							{/* Static -50% centring lives on its own element: Motion writes
							    `transform` on the elements above and below it. */}
							<div className="-translate-x-1/2">
								<motion.div
									ref={cardRef}
									layout={!reduceMotion}
									transition={reduceMotion ? { duration: 0 } : CARD.warp}
									className="overflow-hidden rounded-xl border border-stone-200 bg-bone-white shadow-lg"
								>
									<motion.div
										key={tool.name}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={reduceMotion ? { duration: 0 } : CARD.label}
									>
										<ToolCard name={tool.name} description={tool.description} />
									</motion.div>
								</motion.div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.section>
	);
}
