'use client';

import { useDialKit } from 'dialkit';
import { AnimatePresence, motion, type Transition, useReducedMotion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import type { Shot } from '../../lib/projects';

interface Props {
	shots: Shot[];
}

/* ─────────────────────────────────────────────────────────
 * SHOT SLIDE — STORYBOARD
 *
 *    0ms   shot rests at x:0, filling the frame edge to edge
 *  next    incoming enters from the right, outgoing leaves left
 *  prev    mirrored
 *  ~450ms  both settle, no overshoot
 * ───────────────────────────────────────────────────────── */
const SLIDE = {
	// bounce: 0 = critically damped. The frame is edge-to-edge, so any
	// bounce past x:0 pulls the image off the rounded edge and blinks the
	// white card through for a frame — that was the jump at the tail.
	travel: { type: 'spring', visualDuration: 0.45, bounce: 0 } as const,
};

/* Frame geometry. Must match `w-[432px]` on the image frame below.
 *
 * The two slides are separate absolutely-positioned layers, so if they
 * travel exactly one frame width they *abut* — and at the fractional
 * positions a spring produces, the browser rasterizes each layer's edge
 * independently and the frame's white background leaks through the joint
 * as a 1px hairline. On light shots (Nova) it is invisible; on Nano's
 * near-black edges it reads as a bright divider sweeping across.
 *
 * Travelling one pixel *less* than the frame width makes the layers share
 * a constant 1px overlap for the whole move, closing the joint, while the
 * incoming slide still comes to rest at exactly x:0 — no crop, no offset. */
const FRAME_WIDTH = 432;
const SEAM_OVERLAP = 1;
const TRAVEL = FRAME_WIDTH - SEAM_OVERLAP;

/* Direction-aware slide variants. `custom` carries the travel direction
 * (+1 next, -1 previous); the incoming shot enters from the side it travels
 * from and the outgoing one leaves out the opposite side. */
const slideVariants = {
	enter: (direction: number) => ({ x: direction > 0 ? TRAVEL : -TRAVEL }),
	center: { x: 0 },
	exit: (direction: number) => ({ x: direction > 0 ? -TRAVEL : TRAVEL }),
};

const AUTO_ADVANCE_MS = 4000;

/* ─────────────────────────────────────────────────────────
 * LOCKED SHOT — HOVER STORYBOARD
 *
 * Shots with no `href` (nothing to link out to — e.g. MorvaHR,
 * built under NDA) show a black scrim instead of being clickable.
 * A plain CSS group-hover fade, not Motion — no spring/timing choreography
 * here, just a two-state opacity toggle (also keyboard-reachable via
 * `group-focus-visible` on the tabIndex'd wrapper), so it doesn't need JS.
 *
 *   rest    scrim hidden, shot shows plain
 *  hover    scrim fades in over the shot, message fades up with it
 * ───────────────────────────────────────────────────────── */
const LOCKED = {
	fade: 'transition-opacity duration-200 ease-out',
	text: "This one's private — want to see it? Just ask me directly.",
};

/* ─────────────────────────────────────────────────────────
 * PAGE INDICATOR — MORPH STORYBOARD
 *
 * The active dot is a SINGLE shared pill (motion layoutId) that
 * lives on top of a stable row of stone-200 dots. When the slide
 * changes it doesn't pop from circle→pill at the new index — it
 * physically glides across the gap and morphs from the pill's
 * resting shape, so the indicator reads as one continuous object.
 *
 *   rest    stone-400 pill sits over the active dot (covers it)
 *  change   pill springs to the new dot's slot (position glide)
 *   over    dots underneath stay put; hover lightens inactive ones
 * ───────────────────────────────────────────────────────── */
const INDICATOR = {
	// Spring for the pill's glide between slots. Soft, low-bounce = seamless.
	glide: { type: 'spring', visualDuration: 0.4, bounce: 0.12 } as const,
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
	/* `seq` only ever increases, so the newest slide always gets the highest
	 * z-index. Without it paint order is whatever AnimatePresence happens to
	 * render, and the 1px overlap could show a sliver of the *outgoing* shot
	 * at the frame edge instead of being hidden under the incoming one.
	 *
	 * The frame carries `isolate` so these values stay inside it — otherwise
	 * they escape into the wrapper's stacking context and the slides start
	 * painting over the page-indicator dots, which sit below the frame in
	 * DOM order at z-index auto.
	 *
	 * NOTE: the slide keeps `key={index}`, not `key={seq}`. Exiting layers in
	 * this carousel are never unmounted by AnimatePresence (pre-existing —
	 * they settle at their exit target and stay). Reusing the index as the
	 * key means a stale layer is recycled when you return to that slide,
	 * which caps the strays at shots.length; a unique key per transition
	 * would let them grow without bound. */
	const [{ index, direction, seq }, setSlide] = useState({
		index: 0,
		direction: 0,
		seq: 0,
	});

	// Unique per card so multiple carousels don't share one global layoutId
	// (which would make their pills animate toward each other across the page).
	const pillId = useId();

	const dial = useDialKit('Shot Carousel', {
		travel: SLIDE.travel,
		glide: INDICATOR.glide,
	});

	/* Auto-advance multi-shot carousels every 4s. Disabled for single shots
	 * and when the user prefers reduced motion. The interval is keyed on the
	 * current index, so any change — auto or manual — resets the full 4s. */
	// biome-ignore lint/correctness/useExhaustiveDependencies: `index` is unused in the body but deliberately kept as a dep so manual navigation (goTo) restarts the 5s timer, not just auto-advance.
	useEffect(() => {
		if (shots.length <= 1 || reduceMotion) return;
		const timer = setInterval(() => {
			setSlide((prev) => ({
				index: (prev.index + 1) % shots.length,
				direction: 1,
				seq: prev.seq + 1,
			}));
		}, AUTO_ADVANCE_MS);
		return () => clearInterval(timer);
	}, [shots.length, index, reduceMotion]);

	const current = shots[index];
	if (!current) return null;

	const goTo = (i: number) => {
		if (i === index) return;
		setSlide((prev) => ({
			index: i,
			direction: i > prev.index ? 1 : -1,
			seq: prev.seq + 1,
		}));
	};

	/* DialKit widens its spring configs to a union that includes its own
	 * easing shape, so narrow back to Motion's Transition at the boundary. */
	const slide: Transition = reduceMotion ? { duration: 0 } : (dial.travel as Transition);
	const glide: Transition = reduceMotion ? { duration: 0 } : (dial.glide as Transition);

	return (
		<div className="w-[464px]">
			<div className="relative p-4">
				<div
					className="relative isolate w-[432px] overflow-hidden rounded-[6px] bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_3px_6px_-3px_rgba(0,0,0,0.1)]"
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
							transition={slide}
							style={{
								zIndex: seq,
								willChange: 'transform',
								backfaceVisibility: 'hidden',
							}}
							className="absolute inset-0 transform-gpu"
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
								<button
									type="button"
									aria-label={LOCKED.text}
									className="group relative block size-full cursor-default text-left"
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
									<div
										className={`absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 ${LOCKED.fade}`}
									>
										<p
											aria-hidden="true"
											className="max-w-[280px] -translate-y-1 px-6 text-center text-sm text-white opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
										>
											{LOCKED.text}
										</p>
									</div>
								</button>
							)}
						</motion.div>
					</AnimatePresence>
				</div>

				{shots.length > 1 && (
					<div className="absolute bottom-[31px] left-1/2 flex -translate-x-1/2 items-center">
						{shots.map((shot, i) => {
							const active = i === index;
							return (
								<button
									key={shot.src}
									type="button"
									onClick={() => goTo(i)}
									aria-label={`Show image ${i + 1} of ${shots.length}`}
									aria-current={active}
									className="group/dot relative flex size-6 items-center justify-center"
								>
									{/* Stable base dot — the row never moves; the pill glides over it. */}
									<span className="size-1.5 rounded-full bg-stone-200 transition-colors group-hover/dot:bg-stone-300" />
									{/* Shared active pill — one element that springs between slots. */}
									{active && (
										<span className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
											<motion.span
												layoutId={`activeDot-${pillId}`}
												className="h-1.5 w-3.5 rounded-full bg-stone-400"
												transition={glide}
											/>
										</span>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
