'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ProjectItem } from '../ui/ProjectItem';
import { LinkPreviewCard } from '../ui/LinkPreviewCard';
import type { LinkPreview } from '../ui/LinkPreviewCard';
import { ShotCard } from '../ui/ShotCard';
import { fadeUp, staggerContainer } from '../motion/variants';
import type { Project } from '../../lib/projects';
import { useCanHover } from '../../lib/useCanHover';
import previewData from '../../lib/link-previews.json';

const previews = previewData as Record<string, LinkPreview | undefined>;

/* ─────────────────────────────────────────────────────────
 * SHARED OVERLAY STORYBOARD
 *
 * One card is shared by every project row. Moving between rows never
 * re-enters it; the same card travels vertically and warps its width to
 * fit the new content — exactly how the Tools row shares a single card.
 *
 *  idle    nothing hovered — no card
 *  enter   first hover: card pops up into place
 *  move    another row: card slides Y + morphs width  (no re-entry)
 *  leave   pointer exits the list: card fades out
 *
 * Only one row is `active` at a time (a single index), so the highlight and
 * the card can never point at two projects simultaneously.
 * ───────────────────────────────────────────────────────── */

const GAP = 8; // px between a row's top edge and the card floating above it
const CLOSE_DELAY = 200; // ms grace so the pointer can cross into the card

const CARD = {
	hiddenY: 6, // px below its resting spot while hidden
	travel: { type: 'spring', stiffness: 420, damping: 36 }, // slide between rows
	warp: { type: 'spring', stiffness: 460, damping: 38 }, // width/height morph
	fade: { duration: 0.14, ease: 'easeOut' }, // first show / final hide
	label: { duration: 0.12, ease: 'easeOut' }, // content swap
} as const;

interface Props {
	items: Project[];
}

export function ProjectList({ items }: Props) {
	const reduceMotion = useReducedMotion();
	const canHover = useCanHover();

	const listRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [active, setActive] = useState<number | null>(null);
	const [anchor, setAnchor] = useState<number | null>(null);

	useEffect(() => {
		return () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		};
	}, []);

	const pointAt = (index: number) => {
		const list = listRef.current;
		const item = itemRefs.current[index];
		if (!list || !item) return;

		setAnchor(item.getBoundingClientRect().top - list.getBoundingClientRect().top);
		setActive(index);

		if (closeTimer.current) {
			clearTimeout(closeTimer.current);
			closeTimer.current = null;
		}
	};

	const scheduleClose = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setActive(null), CLOSE_DELAY);
	};

	const activeProject = active === null ? null : items[active];
	const preview = activeProject?.href ? previews[activeProject.href] : undefined;
	const hasCard = Boolean(activeProject && (preview || activeProject.shots?.length));

	const targetTop = (anchor ?? 0) - GAP;

	return (
		<motion.div
			className="relative"
			variants={staggerContainer}
			onPointerLeave={scheduleClose}
		>
			<div ref={listRef} className="flex flex-col">
				{items.map((item, index) => (
					<motion.div
						key={item.title}
						ref={(element) => {
							itemRefs.current[index] = element;
						}}
						variants={fadeUp}
						onPointerEnter={() => pointAt(index)}
						onFocus={() => pointAt(index)}
						onBlur={scheduleClose}
					>
						<ProjectItem
							title={item.title}
							date={item.date}
							href={item.href}
							active={active === index}
						/>
					</motion.div>
				))}
			</div>

			<AnimatePresence>
				{canHover && hasCard && activeProject && (
					<motion.div
						className="pointer-events-auto absolute left-0 top-0 z-20"
						initial={{ top: targetTop + CARD.hiddenY, opacity: 0 }}
						animate={{ top: targetTop, opacity: 1 }}
						exit={{ top: targetTop + CARD.hiddenY, opacity: 0 }}
						transition={reduceMotion ? { duration: 0 } : { top: CARD.travel, default: CARD.fade }}
					>
						<div className="-translate-y-full">
							<motion.div
								layout={!reduceMotion}
								transition={reduceMotion ? { duration: 0 } : CARD.warp}
								className="overflow-hidden rounded-xl border border-stone-200 bg-bone-white shadow-lg"
							>
								<motion.div
									key={activeProject.title}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={reduceMotion ? { duration: 0 } : CARD.label}
								>
									{preview ? (
										<LinkPreviewCard preview={preview} />
									) : (
										activeProject.shots && <ShotCard shots={activeProject.shots} />
									)}
								</motion.div>
							</motion.div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
