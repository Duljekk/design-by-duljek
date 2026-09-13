'use client';

import type { Transition, Variants } from 'motion/react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import previewData from '../../lib/link-previews.json';
import type { Project } from '../../lib/projects';
import { useCanHover } from '../../lib/useCanHover';
import { fadeUp, staggerContainer } from '../motion/variants';
import type { LinkPreview } from '../ui/LinkPreviewCard';
import { LinkPreviewCard, previewCardWidth } from '../ui/LinkPreviewCard';
import { ProjectItem } from '../ui/ProjectItem';
import { ShotCard, SHOT_CARD_WIDTH } from '../ui/ShotCard';

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
 *  move    another row: card slides Y (transform) + warps its box, while the
 *          old body blurs out and the new one blurs in over it  (no re-entry)
 *  leave   pointer exits the list: card fades out
 *
 * Only one row is `active` at a time (a single index), so the highlight and
 * the card can never point at two projects simultaneously.
 *
 * ON TOUCH the same card is driven by presses instead of a pointer. A press on
 * a shot row opens it, a press on the row again — or anywhere outside it, or
 * Escape — closes it. Rows that link straight out are untouched: they stay
 * plain links that open their site, exactly as they do today. The card also
 * changes shape there, spanning the page width inside a 24px gutter with its
 * height falling out of the shot's aspect ratio, and it opens BELOW the
 * pressed row rather than above it — above is where the finger just was, and
 * on a row near the top of the screen there is nothing above to open into.
 * ───────────────────────────────────────────────────────── */

const GAP = 8; // px between the row and the card floating above (or, on touch, below) it
const SCROLL_SETTLE = 80; // ms after a touch open before nudging the card into view
const CLOSE_DELAY = 200; // ms grace so the pointer can cross into the card
const ENTER_DELAY = 140; // ms before a row takes focus, so passing over rows to reach the card doesn't re-target

/* Feature toggle: a single highlight rectangle that morphs (slides Y + warps
 * height) between rows as the active row changes, instead of each row painting
 * its own hover background. Flip to false to fall back to per-row backgrounds
 * if the moving rectangle ends up feeling off. */
const MORPH_HIGHLIGHT = true;

const CARD = {
	hiddenY: 6, // px below its resting spot while hidden
	/* px. Lives here rather than as a `rounded-xl` class because Motion can only
	 * scale-correct a radius it owns: the layout warp is applied as scaleX/scaleY,
	 * and a class-set radius squashes with the box — the corners visibly flatten
	 * on any morph with a big size delta, then snap round at the end. */
	radius: 12,
	/* bounce: 0 = critically damped. The card is large and carries an image —
	 * any overshoot on the travel or the warp reads as a wobble rather than a
	 * morph, and the image edge visibly rubber-bands past its resting box. */
	travel: { type: 'spring', visualDuration: 0.32, bounce: 0 }, // slide between rows
	warp: { type: 'spring', visualDuration: 0.34, bounce: 0 }, // width/height morph
	fade: { duration: 0.14, ease: 'easeOut' }, // first show / final hide
	/* Content swap during a morph. The outgoing card body blurs + fades out
	 * while the incoming one blurs + fades in over the top, so the box warping
	 * from one project's card to the next reads as one soft morph instead of a
	 * hard content cut — same treatment the Tools row's shared card uses, with
	 * a wider blur because these bodies carry imagery, not just a name.
	 *
	 * `out` deliberately runs the full length of the warp. These bodies are very
	 * different widths (a 320px link preview vs a 432px shot frame), so on a
	 * shrink the box stays wider than the incoming body for the whole warp — and
	 * anywhere the outgoing body has already gone, the shell's own bone-white
	 * paints through as an empty band down the trailing edge. Holding the
	 * outgoing body until the box has caught up keeps the card full of content
	 * at every frame; `easeIn` keeps it near-opaque early and drops it late. */
	body: {
		blur: 6, // px the body is blurred through as it swaps
		in: { duration: 0.26, ease: 'easeOut' }, // incoming body resolves into focus
		out: { duration: 0.34, ease: 'easeIn' }, // outgoing body holds, then softens away
	},
} as const;

/* The shared highlight rectangle behind the active row. It travels on a
 * transform and only its height is a layout property, so sliding between rows
 * costs one composited move rather than a top/height reflow per frame. */
const HIGHLIGHT = {
	travel: { type: 'spring', visualDuration: 0.28, bounce: 0 }, // slide between rows
	warp: { type: 'spring', visualDuration: 0.24, bounce: 0 }, // height morph
	fade: { duration: 0.14, ease: 'easeOut' }, // first show / final hide
} as const;

interface Props {
	items: Project[];
	/* Entrance language for the rows. Defaults to the site-wide scroll-in
	 * cascade; a list that is being *replaced* rather than revealed — a tab
	 * panel — passes the tighter `swap*` pair instead, so the rows ripple in
	 * under the press instead of re-running the section's intro. */
	containerVariants?: Variants;
	itemVariants?: Variants;
}

/* Which rows own a card on touch. A project with an `href` is a direct link
 * and keeps its current behaviour — one press, the site opens — so only the
 * shot-only projects become press-to-open. */
const hasTouchCard = (project?: Project): boolean =>
	Boolean(project && !project.href && project.shots?.length);

/* The width of the card a project will show, so the incoming og:image can
 * start its scale at the outgoing card's width. Preview cards win when a
 * project carries both (same precedence as ProjectCardBody's render). */
const cardWidthOf = (project: Project, preview?: LinkPreview): number => {
	if (preview) return previewCardWidth(project.previewImageScale);
	if (project.shots?.length) return SHOT_CARD_WIDTH;
	return previewCardWidth();
};

/* One content layer inside the shared card. A layer on its way out is lifted
 * from flow, so the card's width/height warp is driven only by the incoming
 * body and the crossfade never waits on the outgoing one. AnimatePresence's
 * `wait` mode would serialise every swap (out, then in) — across a sweep down
 * the list that queue leaves the card lagging rows behind the pointer. */
function ProjectCardBody({
	project,
	preview,
	imageMorph,
	exitScaleRef,
	reduceMotion,
	fluid,
}: {
	project: Project;
	preview?: LinkPreview;
	/* See `imageMorph` / `exitScaleRef` in ProjectList — passed through to the og:image. */
	imageMorph?: { from: number; to: number; spring: Transition };
	exitScaleRef?: RefObject<number>;
	reduceMotion: boolean;
	/* Touch: the shot frame is sized by the card instead of the Figma width. */
	fluid: boolean;
}) {
	const isPresent = useIsPresent();

	return (
		<motion.div
			/* `layout` here is not animating this layer — it is what makes Motion
			 * counter-scale it against the shell's warp, so the TEXT stays crisp at
			 * true size while the frame morphs around it. The shell warps via
			 * scaleX/scaleY, and a body without its own layout node is stretched by
			 * that non-uniform scale for the whole spring — running text through it
			 * reads as a wobble, and a 432 → 320 shot swap squashes ~25% and pops.
			 * With `layout` the body holds its true size and the shell simply clips
			 * or reveals it. The og:image is the one exception to the counter-scale:
			 * it animates its own uniform scale (`imageMorph`) so it resizes WITH
			 * the morph instead of sitting at final size under a warping frame. */
			layout={reduceMotion ? false : 'position'}
			className={isPresent ? undefined : 'absolute top-0 left-0'}
			initial={reduceMotion ? false : { opacity: 0, filter: `blur(${CARD.body.blur}px)` }}
			animate={{ opacity: 1, filter: 'blur(0px)' }}
			exit={
				reduceMotion
					? { opacity: 0 }
					: {
							opacity: 0,
							filter: `blur(${CARD.body.blur}px)`,
							transition: CARD.body.out,
						}
			}
			transition={reduceMotion ? { duration: 0 } : { ...CARD.body.in, layout: CARD.warp }}
		>
			{preview ? (
				<a
					href={project.href}
					target="_blank"
					rel="noopener noreferrer"
					className="block"
					aria-label={project.title}
				>
					<LinkPreviewCard
						preview={preview}
						imageScale={project.previewImageScale}
						imageBoxHeight={project.previewImageHeight}
						imageMorph={imageMorph}
						exitScaleRef={exitScaleRef}
					/>
				</a>
			) : (
				project.shots && <ShotCard shots={project.shots} fluid={fluid} />
			)}
		</motion.div>
	);
}

export function ProjectList({
	items,
	containerVariants = staggerContainer,
	itemVariants = fadeUp,
}: Props) {
	const reduceMotion = useReducedMotion();
	const canHover = useCanHover();

	const listRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
	const cardRef = useRef<HTMLDivElement>(null);
	const hoveredIndexRef = useRef<number | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	/* Width of the card on screen BEFORE the current one. Read while the new
	 * body mounts (so its og:image can start scaling from the outgoing card's
	 * width), then re-recorded in an effect — a render-time write would leak
	 * the new width into StrictMode's second render pass and kill the morph. */
	const prevCardWidthRef = useRef<number | null>(null);
	/* Width factor the OUTGOING og:image scales toward when a row move pushes
	 * it out: the incoming card's width over the outgoing's. Written during
	 * render so it is fresh the moment Motion starts the exit at the commit.
	 * Stable identity — the exiting body's frozen props still point here, so
	 * its image reads `.current` live at exit-start (a value prop would be a
	 * frozen stale one). 1 = no exit scale (close, first show, same width). */
	const exitScaleRef = useRef(1);

	const [active, setActive] = useState<number | null>(null);
	const [anchor, setAnchor] = useState<number | null>(null);
	const [anchorHeight, setAnchorHeight] = useState(0);

	useEffect(() => {
		return () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
			if (enterTimer.current) clearTimeout(enterTimer.current);
		};
	}, []);

	const pointAt = (index: number) => {
		const list = listRef.current;
		const item = itemRefs.current[index];
		if (!list || !item) return;

		const itemRect = item.getBoundingClientRect();
		setAnchor(itemRect.top - list.getBoundingClientRect().top);
		setAnchorHeight(itemRect.height);
		setActive(index);

		if (closeTimer.current) {
			clearTimeout(closeTimer.current);
			closeTimer.current = null;
		}
	};

	const cancelPointAt = () => {
		if (enterTimer.current) {
			clearTimeout(enterTimer.current);
			enterTimer.current = null;
		}
	};

	const schedulePointAt = (index: number) => {
		if (closeTimer.current) {
			clearTimeout(closeTimer.current);
			closeTimer.current = null;
		}
		cancelPointAt();
		enterTimer.current = setTimeout(() => pointAt(index), ENTER_DELAY);
	};

	const scheduleClose = () => {
		cancelPointAt();
		/* Forget the last-hovered row. Without this, re-entering the SAME row
		 * fails the `hoveredIndexRef !== index` guard in the move handler, so it
		 * never re-points — while this pending close timer still fires and hides
		 * the card. Clearing it lets a re-hover of the same row reopen the card. */
		hoveredIndexRef.current = null;
		if (closeTimer.current) clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setActive(null), CLOSE_DELAY);
	};

	/* Touch's counterpart to hover: a press points the card at a row, and a
	 * press on the row it is already pointing at puts it away. */
	const toggle = (index: number) => {
		if (active === index) setActive(null);
		else pointAt(index);
	};

	/* Touch dismissal. A press outside the card closes it, as does Escape.
	 * Presses on a row that owns a card are left alone — `toggle` is what
	 * decides whether that press opens, moves, or closes the card, and closing
	 * here first would make a press on the open row close then reopen it. */
	useEffect(() => {
		if (canHover || active === null) return;

		const closeOnOutside = (event: PointerEvent) => {
			const node = event.target as Node | null;
			if (!node || cardRef.current?.contains(node)) return;

			const row = itemRefs.current.findIndex((item) => item?.contains(node));
			if (row !== -1 && hasTouchCard(items[row])) return;

			setActive(null);
		};

		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setActive(null);
		};

		document.addEventListener('pointerdown', closeOnOutside);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('pointerdown', closeOnOutside);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, [canHover, active, items]);

	/* The card opens below the pressed row, so on a row near the bottom of the
	 * screen it can land under the fold and read as nothing having happened.
	 * `nearest` is a no-op when it is already fully visible. */
	useEffect(() => {
		if (canHover || active === null) return;

		const timer = setTimeout(() => {
			cardRef.current?.scrollIntoView({
				block: 'nearest',
				behavior: reduceMotion ? 'auto' : 'smooth',
			});
		}, SCROLL_SETTLE);
		return () => clearTimeout(timer);
	}, [canHover, active, reduceMotion]);

	/* Deterministic hover target detection: resolve what's actually under the
	 * pointer via elementFromPoint (honours the card's z-index/pointer-events,
	 * which enter/leave events get wrong across the overlapping card). A row
	 * is committed only after ENTER_DELAY and only if it's still the target. */
	const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		const el = document.elementFromPoint(event.clientX, event.clientY);
		if (!el) return;

		if (cardRef.current?.contains(el)) {
			hoveredIndexRef.current = null;
			cancelPointAt();
			return;
		}

		const index = itemRefs.current.findIndex((item) => item && item.contains(el));
		if (index === -1) {
			hoveredIndexRef.current = null;
			cancelPointAt();
			return;
		}

		if (hoveredIndexRef.current !== index) {
			hoveredIndexRef.current = index;
			schedulePointAt(index);
		}
	};

	const activeProject = active === null ? null : items[active];
	const preview = activeProject?.href ? previews[activeProject.href] : undefined;
	const hasCard = Boolean(
		activeProject &&
			(canHover ? preview || activeProject.shots?.length : hasTouchCard(activeProject)),
	);
	const cardWidth = hasCard && activeProject ? cardWidthOf(activeProject, preview) : null;

	/* The og:image morph — both directions of a row move, always uniform (width
	 * and height together, aspect intact) and always on the shell's warp
	 * spring, so the images track the frame's width exactly:
	 *   incoming — starts at the outgoing card's width factor, settles to 1
	 *   outgoing — scales toward the incoming card's width factor (exitScaleRef)
	 * No morph on first show, reduced motion, or same-width swaps (1 = rest). */
	const morphStart =
		prevCardWidthRef.current && cardWidth ? prevCardWidthRef.current / cardWidth : 1;
	exitScaleRef.current =
		cardWidth && prevCardWidthRef.current ? cardWidth / prevCardWidthRef.current : 1;
	const imageMorph = preview
		? {
				from: morphStart,
				to: 1,
				spring: (reduceMotion ? { duration: 0 } : CARD.warp) as Transition,
			}
		: undefined;

	/* Records this render's card width for the NEXT morph — after the body
	 * has mounted, so its og:image initial still read the outgoing width. */
	useEffect(() => {
		prevCardWidthRef.current = cardWidth;
	});

	/* Hover hangs the card above the row; touch drops it below (see the
	 * storyboard). Either way it is pinned by the edge that has to hold a
	 * steady GAP from the row, so its height can change without it moving. */
	const below = !canHover;
	const targetTop = below ? (anchor ?? 0) + anchorHeight + GAP : (anchor ?? 0) - GAP;

	return (
		<motion.div
			className="relative"
			variants={containerVariants}
			onPointerLeave={canHover ? scheduleClose : undefined}
			onPointerMove={canHover ? handlePointerMove : undefined}
		>
			{/* Single highlight rectangle shared by every row — it slides Y and
			 * warps its height to sit behind the active row instead of each row
			 * lighting its own background. Sits under the rows (z-0); the list
			 * gets its own stacking context (z-10) so text paints on top. */}
			{MORPH_HIGHLIGHT && (
				<AnimatePresence>
					{active !== null && (
						<motion.div
							aria-hidden="true"
							className="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-xl bg-stone-100"
							initial={{ opacity: 0, y: anchor ?? 0, height: anchorHeight }}
							animate={{ opacity: 1, y: anchor ?? 0, height: anchorHeight }}
							exit={{ opacity: 0 }}
							transition={
								reduceMotion
									? { duration: 0 }
									: { y: HIGHLIGHT.travel, height: HIGHLIGHT.warp, opacity: HIGHLIGHT.fade }
							}
						/>
					)}
				</AnimatePresence>
			)}

			<div ref={listRef} className="relative z-10 flex flex-col">
				{items.map((item, index) => (
					<motion.div
						key={item.title}
						ref={(element) => {
							itemRefs.current[index] = element;
						}}
						variants={itemVariants}
						onFocus={canHover ? () => pointAt(index) : undefined}
						onBlur={canHover ? scheduleClose : undefined}
					>
						<ProjectItem
							title={item.title}
							date={item.date}
							href={item.href}
							active={active === index}
							interactive={Boolean(item.href || item.shots?.length)}
							sharedHighlight={MORPH_HIGHLIGHT}
							onActivate={!canHover && hasTouchCard(item) ? () => toggle(index) : undefined}
							expanded={!canHover && hasTouchCard(item) ? active === index : undefined}
						/>
					</motion.div>
				))}
			</div>

			<AnimatePresence>
				{hasCard && activeProject && (
					<motion.div
						ref={cardRef}
						/* Touch: `inset-x-3` inside the page's own `px-3` gutter puts the
						   card's edges 24px off the viewport, flush with the row title
						   above it. Hover keeps the card at its own content width. */
						className={`pointer-events-auto absolute top-0 z-20 ${below ? 'inset-x-3' : 'left-0'}`}
						initial={{ y: targetTop + CARD.hiddenY, opacity: 0 }}
						animate={{ y: targetTop, opacity: 1 }}
						exit={{ y: targetTop + CARD.hiddenY, opacity: 0 }}
						transition={reduceMotion ? { duration: 0 } : { y: CARD.travel, default: CARD.fade }}
					>
						{/* The card hangs off a zero-height anchor line and is pinned by the
						    edge that has to stay a steady GAP from the row — its BOTTOM edge
						    above the row, its TOP edge below it. A `-translate-y-full` lift
						    cannot do the hover job: it resolves against the card's own height,
						    and Motion's layout warp snaps the real layout box to the new size
						    on the first frame (only the visual scale springs), so the lift
						    would jump the whole card the instant a taller or shorter body
						    mounted. Pinning against a zero-height parent is
						    height-independent, so only the free edge travels. */}
						<div className={`absolute ${below ? 'inset-x-0 top-0' : 'bottom-0 left-0'}`}>
							<motion.div
								layout={!reduceMotion}
								transition={reduceMotion ? { duration: 0 } : CARD.warp}
								style={{ borderRadius: CARD.radius }}
								className="relative overflow-hidden border border-stone-200 bg-bone-white shadow-lg"
							>
								{/* Sync mode: the outgoing body blurs away out of flow while the
								    incoming one blurs in and drives the warp, so a fast sweep down
								    the list resolves straight to the row under the pointer instead
								    of replaying every card it crossed. */}
								<AnimatePresence initial={false}>
									<ProjectCardBody
										key={activeProject.title}
										project={activeProject}
										preview={preview}
										imageMorph={imageMorph}
										exitScaleRef={exitScaleRef}
										reduceMotion={!!reduceMotion}
										fluid={below}
									/>
								</AnimatePresence>
							</motion.div>
							{/* Invisible strip below the card that covers the GAP, so moving
							 * the pointer up from the active row lands on the card instead of
							 * crossing the row above and re-targeting it. Hover only — there
							 * is no pointer to shepherd across the gap on touch, and below the
							 * row the strip would sit over the next row's press target. */}
							{!below && <div aria-hidden="true" className="absolute top-full h-4 w-full" />}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
