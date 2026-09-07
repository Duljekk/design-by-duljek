'use client';

import { AnimatePresence, motion, useReducedMotion, useSpring } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectCategory } from '../../lib/projects';
import { pastWorks } from '../../lib/projects';
import {
	fadeUp,
	staggerContainer,
	staggerContainerDelayed,
	swapContainer,
	swapItem,
	viewportOnce,
} from '../motion/variants';
import { SectionHeading } from '../ui/SectionHeading';
import type { TabItem } from '../ui/Tabs';
import { Tabs } from '../ui/Tabs';
import { ProjectList } from './ProjectList';

/* ─────────────────────────────────────────────────────────
 * PANEL SWAP STORYBOARD
 *
 * The two categories share no rows, so a press replaces the whole list.
 *
 *   0ms   panel starts springing to the incoming list's height
 *   0ms   outgoing list fades — popped out of flow, so it stops driving the
 *         panel's height the instant it leaves
 *   0ms   incoming rows ripple in, 35ms apart, 6px of travel each
 * ~280ms  panel settled at the new height
 * ~330ms  last row landed
 *
 * FOUR THINGS MAKE THIS FEEL SMOOTH, and each was a separate fault before:
 *
 * 1. THE PANEL OWNS ITS HEIGHT. `popLayout` frees the panel of the outgoing
 *    list on frame one, so its natural height snapped a whole row's worth and
 *    dragged everything below the section with it. The height is a spring here
 *    instead, written from the commit's layout phase so it is already
 *    travelling on the frame the new rows first paint. Until there is a real
 *    measurement the panel stays at `auto` — a spring resting at 0 would paint
 *    one collapsed frame on hydration, which is the same jolt in miniature.
 *
 * 2. THE BOX LEADS, THE ROWS FOLLOW. The panel resizes faster than the rows
 *    resolve, so on a growing list the room is made before there is anything
 *    visible to put in it — no row is ever painted over the divider below, and
 *    no `overflow-hidden` is needed to hide one (which would have clipped
 *    ProjectList's hover card, since that floats above the panel's top edge).
 *
 * 3. ONE TRANSLATE, NOT TWO. The wrapper used to slide 8px while every row slid
 *    24px inside it; two compounding translates on the same pixels is what read
 *    as mush. The wrapper now only fades on exit — all travel belongs to the
 *    rows, and only on the way in.
 *
 * 4. THE LIST NAMES ITS OWN ENTRANCE. The rows used to inherit `visible` from
 *    the section, through AnimatePresence. But presence is a context: the
 *    boundary hands every descendant its own idea of what "initial" means, so
 *    the cascade below it was never really the section's to give. Each list
 *    states its labels outright — `whileInView` for the first reveal, a plain
 *    `animate` for every list a press brings in. The one thing inheritance was
 *    buying, the 120ms beat between the heading and the first row, is bought
 *    back with `delayChildren` instead of left to a context.
 * ───────────────────────────────────────────────────────── */

const PANEL = {
	/* Critically damped: the section below moves with this, and anything below
	 * the fold rubber-banding on a filter press is the definition of unsteady. */
	resize: { stiffness: 500, damping: 45 },
	/* Short and linear-ish. The outgoing list is only ever leaving; drawing
	 * attention to how it leaves competes with the rows arriving. */
	out: { duration: 0.12, ease: 'easeOut' },
} as const;

const TAB_ID = 'past-works';
const PANEL_ID = 'past-works-panel';

const TABS: readonly TabItem[] = [
	{ id: 'web', label: 'Web' },
	{ id: 'product', label: 'Product' },
];

export function PastWorks() {
	const reduceMotion = useReducedMotion();
	const [tab, setTab] = useState<ProjectCategory>('web');
	/* First reveal is a scroll-in and takes the site-wide cascade; everything
	 * after a press is a swap and takes the tighter ripple. Same component, two
	 * moments, two languages. */
	const [swapped, setSwapped] = useState(false);

	/* Only the *fact* of a measurement is state — it decides whether the panel
	 * is sized by the DOM or by the spring, and it flips exactly once. The
	 * height itself stays a motion value, so the spring never re-renders. */
	const [measured, setMeasured] = useState(false);
	const hasMeasured = useRef(false);
	const observerRef = useRef<ResizeObserver | null>(null);
	const height = useSpring(0, PANEL.resize);

	const items = useMemo(() => pastWorks.filter((item) => item.category === tab), [tab]);

	/* Measurement hangs off the ref callback rather than an effect, because the
	 * callback IS the "the list element changed" event — no `tab` in a
	 * dependency array standing in for it. It also runs in the commit's layout
	 * phase, ahead of paint, where an effect would land a frame late.
	 *
	 * The incoming list is measured, not the panel: the panel's height is the
	 * thing being driven, and `popLayout` has not necessarily lifted the
	 * outgoing list out of flow yet. */
	const attachList = useCallback(
		(element: HTMLDivElement | null) => {
			/* Ignore React's detach. Through a swap both lists are mounted against
			 * this one ref, and the outgoing fiber calls with null ~120ms after the
			 * incoming one has already claimed it. */
			if (!element) return;

			const sync = () => {
				const next = element.getBoundingClientRect().height;
				/* The first measurement is a resting height, not a transition — and
				 * reduced motion wants every later one treated the same way. */
				if (hasMeasured.current && !reduceMotion) height.set(next);
				else height.jump(next);
				hasMeasured.current = true;
				setMeasured(true);
			};

			sync();

			/* Rows are text in a webfont, and the list is laid out before Switzer
			 * lands; without this the panel would hold a stale height. */
			observerRef.current?.disconnect();
			observerRef.current = new ResizeObserver(sync);
			observerRef.current.observe(element);
		},
		[height, reduceMotion],
	);

	useEffect(() => () => observerRef.current?.disconnect(), []);

	const selectTab = (id: string) => {
		setSwapped(true);
		setTab(id as ProjectCategory);
	};

	/* A swapped-in list is already on screen, so it animates on mount; the first
	 * one waits for the viewport like every other section on the page. */
	const entrance = reduceMotion
		? { initial: 'visible' as const }
		: swapped
			? { initial: 'hidden' as const, animate: 'visible' as const }
			: {
					initial: 'hidden' as const,
					whileInView: 'visible' as const,
					viewport: viewportOnce,
				};

	return (
		<motion.section
			className="flex flex-col gap-4.5"
			variants={staggerContainer}
			initial={reduceMotion ? 'visible' : 'hidden'}
			whileInView="visible"
			viewport={viewportOnce}
		>
			<motion.div
				className="flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
				variants={fadeUp}
			>
				<SectionHeading title="Past Works">
					Campus and client work from my college years
				</SectionHeading>
				<Tabs
					id={TAB_ID}
					items={TABS}
					value={tab}
					onChange={selectTab}
					panelId={PANEL_ID}
					className="self-start sm:self-auto"
				/>
			</motion.div>

			<motion.div
				id={PANEL_ID}
				role="tabpanel"
				aria-labelledby={`${TAB_ID}-tab-${tab}`}
				className="relative"
				style={{ height: measured ? height : 'auto' }}
			>
				<AnimatePresence mode="popLayout">
					<motion.div
						key={tab}
						ref={attachList}
						{...entrance}
						exit={{ opacity: 0, transition: PANEL.out }}
					>
						<ProjectList
							items={items}
							containerVariants={swapped ? swapContainer : staggerContainerDelayed}
							itemVariants={swapped ? swapItem : fadeUp}
						/>
					</motion.div>
				</AnimatePresence>
			</motion.div>
		</motion.section>
	);
}
