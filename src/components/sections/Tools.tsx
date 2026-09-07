'use client';

import type { DialConfig } from 'dialkit';
import { useDialKit } from 'dialkit';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import type { Tool } from '../../lib/tools';
import { tools } from '../../lib/tools';
import { useCanHover } from '../../lib/useCanHover';
import { fadeUp, popIn, staggerContainer, viewportOnce } from '../motion/variants';
import { SectionHeading } from '../ui/SectionHeading';
import { ToolCard } from '../ui/ToolCard';
import type { ChipParams } from '../ui/ToolItem';
import { ToolItem } from '../ui/ToolItem';

/* ─────────────────────────────────────────────────────────
 * TOOLS — SHARED HOVER CARD STORYBOARD
 *
 * One card is shared by every tool. Moving between tools never
 * re-enters it; the same card travels sideways and warps its
 * width to fit the new label.
 *
 *  idle    nothing hovered — card parked, faded out
 *  enter   first hover: card jumps to the chip and fades up
 *  move    another tool: card slides X + warps width  (no re-entry)
 *  leave   pointer exits the row: card fades out, stays parked
 *
 * The card is mounted from the first hover onwards and only ever
 * fades — it is never unmounted. Tearing it down would put every
 * re-entry behind an AnimatePresence exit, and re-entering the row
 * inside that exit window (easy to do when sweeping the row fast, a
 * few px of vertical drift is enough) leaves the card stranded
 * invisible while the row carries on tracking the pointer.
 * ───────────────────────────────────────────────────────── */

const CARD = {
	edgePadding: 8, // px kept between card and window edge
	hiddenY: 4, // px below its resting spot while hidden
	hiddenScale: 0.96, // scale while hidden
	travel: { type: 'spring', stiffness: 420, damping: 36 }, // slide between tools
	warp: { type: 'spring', stiffness: 460, damping: 38 }, // width/height morph
	fade: { duration: 0.14, ease: 'easeOut' }, // first show / final hide
	/* Name swap during a morph. The outgoing name blurs + fades out while the
	 * incoming one blurs + fades in over the top, so the width warp reads as one
	 * soft morph instead of a hard text cut — same feel as the Attio navbar's
	 * morphing dropdown (~3px content blur). */
	label: {
		blur: 4, // px the name is blurred through as it swaps
		in: { duration: 0.2, ease: 'easeOut' }, // incoming name resolves into focus
		out: { duration: 0.14, ease: 'easeIn' }, // outgoing name softens away
	},
} as const;

/* ─────────────────────────────────────────────────────────
 * SPREAD — the row parts around the hovered chip
 *
 *   idle    nothing hovered — chips rest, packed at the -8 gap
 *   hover   chips left of the hovered one shift left, chips right
 *           shift right by `distance`; the hovered chip never moves,
 *           so a clean gap opens on either side of it
 *   move    hover another chip — every chip retargets its offset
 *   leave   pointer exits the row — all chips settle back to 0
 *
 * Driven by the same `active` index as the card, so both stay in
 * sync. The spring retargets from wherever a chip currently sits, so
 * sweeping across the row mid-animation stays smooth and interruptible.
 * ───────────────────────────────────────────────────────── */
const SPREAD = {
	distance: 16, // px each side is pushed away from the hovered chip
	spring: { type: 'spring', stiffness: 380, damping: 30 }, // smooth, interruptible
} as const;

interface Anchor {
	centerX: number; // hovered icon's centre, relative to the row
	rowLeft: number; // row's offset in the viewport
	viewportWidth: number;
}

/* One DialKit section per chip, built from the tools data so every panel
 * default matches the design. Sections start collapsed so the shared `chip`
 * geometry folder stays readable. */
const CHIP_SECTIONS: DialConfig = Object.fromEntries(
	tools.map((tool) => {
		let section: DialConfig;
		if (tool.background) {
			// Padded chip with a solid fill (Figma, Framer, Claude, Supabase, Cursor, Vercel).
			section = {
				_collapsed: true,
				background: tool.background,
				border: tool.border ?? '#1a1a1a',
				highlight: [tool.highlight ?? 0.2, 0, 1],
			};
		} else if (tool.border) {
			// Self-contained logo with a tunable border, no background slider —
			// giving it one would leak a phantom fill into chipParams and flip
			// ToolItem back to the padded-chip render branch (e.g. Jitter).
			section = {
				_collapsed: true,
				border: tool.border,
				highlight: [tool.highlight ?? 0.2, 0, 1],
			};
		} else {
			// Fully bare self-contained logo.
			section = {
				_collapsed: true,
				opacity: [1, 0, 1],
			};
		}
		return [tool.name.toLowerCase(), section];
	}),
);

type ChipSection = { background?: string; border?: string; highlight?: number; opacity?: number };

/* One name layer inside the shared card. A layer that is on its way out is
 * lifted from flow, so the card's width warp is driven only by the incoming
 * name and the crossfade never waits on the outgoing one. AnimatePresence's
 * `wait` mode would serialise every swap (out, then in) — across a fast sweep
 * that queue leaves the card lagging chips behind the pointer. */
function ToolCardLabel({ tool, reduceMotion }: { tool: Tool; reduceMotion: boolean }) {
	const isPresent = useIsPresent();

	return (
		<motion.div
			className={isPresent ? undefined : 'absolute top-0 left-0'}
			initial={reduceMotion ? false : { opacity: 0, filter: `blur(${CARD.label.blur}px)` }}
			animate={{ opacity: 1, filter: 'blur(0px)' }}
			exit={
				reduceMotion
					? { opacity: 0 }
					: {
							opacity: 0,
							filter: `blur(${CARD.label.blur}px)`,
							transition: CARD.label.out,
						}
			}
			transition={reduceMotion ? { duration: 0 } : CARD.label.in}
		>
			<ToolCard name={tool.name} description={tool.description} />
		</motion.div>
	);
}

export function Tools() {
	const reduceMotion = useReducedMotion();
	const canHover = useCanHover();

	const dial = useDialKit('Tool Chips', {
		chip: {
			width: [32, 20, 48],
			height: [33, 20, 48],
			radius: [8, 0, 24],
			borderWidth: [1, 0, 4],
			gap: [-8, -24, 4],
		},
		spread: {
			distance: [SPREAD.distance, 0, 48], // px chips part on either side of the hovered chip
		},
		...CHIP_SECTIONS,
	});

	const rowRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

	const [active, setActive] = useState<number | null>(null);
	/* The card stays mounted once it has shown a tool — it only fades out. An
	 * unmounting card has to exit through AnimatePresence, and an exit stranded
	 * by the layout warp blocks the next card from ever mounting: the row keeps
	 * tracking the pointer while the card sits invisible. Hence `shown` holds
	 * the last tool so the card still has a name to render while fading out. */
	const [shown, setShown] = useState<Tool | null>(null);
	/* Bumped on each fresh entry into the row, so the previous hover's name
	 * layers are dropped rather than crossfaded over the newly arriving card. */
	const [session, setSession] = useState(0);
	/* True while the current hover began on a hidden card: the card teleports to
	 * the chip and sizes itself instantly instead of sliding in from wherever
	 * the last hover left it. */
	const [jump, setJump] = useState(true);
	const [anchor, setAnchor] = useState<Anchor | null>(null);
	const [cardWidth, setCardWidth] = useState(0);

	/* The card's width drives edge-clamping, and it changes as names swap and
	 * when the webfont loads — so observe it rather than measuring once. A ref
	 * callback rather than an effect: the card mounts on the first hover and
	 * then stays, so there is nothing for a dependency list to track. */
	const measureCard = useCallback((element: HTMLDivElement | null) => {
		if (!element) return;

		const sync = () => setCardWidth(element.getBoundingClientRect().width);
		sync();

		const observer = new ResizeObserver(sync);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

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
		if (active === null) {
			setJump(true);
			setSession((count) => count + 1);
		} else {
			setJump(false);
		}
		setActive(index);
		setShown(tools[index]);
	};

	/* How far the row parts on either side of the hovered chip. Zero for
	 * reduced-motion and non-hover (touch) so nothing shifts under a tap. */
	const spread = reduceMotion || !canHover ? 0 : dial.spread.distance;

	/* The first chip rests flush against the section's left padding, so if the
	 * left-of-hover group slid left it would carry that chip past the edge.
	 * Instead we pin the row's left edge: whenever a chip past the first is
	 * hovered, the whole row is nudged right by `spread`, keeping every gap the
	 * same while chip 0 stays put at the padding. */
	const leftEdgePin = active !== null && active > 0 ? spread : 0;

	/* Centre the card on the tool, but never let it hang off the window. The
	 * hovered chip itself shifts by `leftEdgePin`, so the card tracks it. */
	const targetX = (() => {
		if (!anchor) return 0;
		const half = cardWidth / 2;
		const min = CARD.edgePadding + half - anchor.rowLeft;
		const max = anchor.viewportWidth - CARD.edgePadding - half - anchor.rowLeft;
		const center = anchor.centerX + leftEdgePin;
		return Math.min(Math.max(center, min), Math.max(min, max));
	})();

	const visible = active !== null;

	/* Offset a chip takes so the row parts around the hovered one. Hovering the
	 * first chip (Figma) is an exception: it's the pinned left anchor, so its
	 * spread would only shove every other chip right — leave the row still. */
	const spreadX = (index: number) => {
		if (active === null || active === 0 || spread === 0) return 0;
		const base = index < active ? -spread : index > active ? spread : 0;
		return base + leftEdgePin;
	};

	const sectionOf = (name: string): ChipSection =>
		(dial as unknown as Record<string, ChipSection>)[name.toLowerCase()] ?? {};

	const chipParams = (item: Tool): ChipParams => {
		const section = sectionOf(item.name);
		return {
			width: dial.chip.width,
			height: dial.chip.height,
			radius: dial.chip.radius,
			borderWidth: dial.chip.borderWidth,
			background: section.background ?? item.background,
			border: section.border ?? item.border,
			highlight: section.highlight ?? item.highlight ?? 0.2,
			highlightRgb: item.highlightRgb,
			opacity: section.opacity ?? 1,
		};
	};

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
				<div ref={rowRef} className="flex">
					{tools.map((item, index) => (
						<motion.div
							key={`${item.name}-${index}`}
							ref={(element) => {
								itemRefs.current[index] = element;
							}}
							variants={popIn}
							/* Descending z so earlier chips overlap later ones — Figma sits
							   on top, Vercel underneath. Flex items honour z-index without
							   needing position. */
							style={{
								zIndex: tools.length - index,
								...(index > 0 ? { marginLeft: dial.chip.gap } : {}),
							}}
							onPointerEnter={() => pointAt(index)}
						>
							{/* Inner layer carries the spread offset only. Keeping it off the
							    measured outer wrapper means the hover card stays anchored to
							    each chip's resting centre while its neighbours slide away. */}
							<motion.div
								animate={{ x: spreadX(index) }}
								transition={reduceMotion ? { duration: 0 } : SPREAD.spring}
							>
								<ToolItem
									name={item.name}
									icon={item.icon}
									iconWidth={item.iconWidth}
									iconHeight={item.iconHeight}
									description={item.description}
									chip={chipParams(item)}
									hovered={canHover && active === index}
								/>
							</motion.div>
						</motion.div>
					))}
				</div>

				{canHover && shown && (
					<motion.div
						aria-hidden
						className="pointer-events-none absolute bottom-full left-0 z-20 mb-2"
						initial={{ x: targetX, y: CARD.hiddenY, opacity: 0, scale: CARD.hiddenScale }}
						animate={{
							x: targetX,
							y: visible ? 0 : CARD.hiddenY,
							opacity: visible ? 1 : 0,
							scale: visible ? 1 : CARD.hiddenScale,
						}}
						transition={
							reduceMotion
								? { duration: 0 }
								: { x: jump ? { duration: 0 } : CARD.travel, default: CARD.fade }
						}
					>
						{/* Static -50% centring lives on its own element: Motion writes
						    `transform` on the elements above and below it. */}
						<div className="-translate-x-1/2">
							<motion.div
								ref={measureCard}
								layout={!reduceMotion}
								transition={reduceMotion || jump ? { duration: 0 } : CARD.warp}
								className="relative overflow-hidden rounded-xl border border-stone-200 bg-bone-white shadow-lg"
							>
								{/* Sync mode: the outgoing name blurs away out of flow while the
								    incoming one blurs in and drives the width warp, so a fast sweep
								    resolves straight to the chip under the pointer instead of
								    replaying every name it crossed. */}
								<AnimatePresence key={session} initial={false}>
									<ToolCardLabel key={shown.name} tool={shown} reduceMotion={!!reduceMotion} />
								</AnimatePresence>
							</motion.div>
						</div>
					</motion.div>
				)}
			</motion.div>
		</motion.section>
	);
}
