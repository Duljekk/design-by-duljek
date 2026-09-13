'use client';

import { useDialKit } from 'dialkit';
import {
	animate,
	type MotionValue,
	motion,
	type Transition,
	useMotionValue,
	useReducedMotion,
	useTransform,
	type ValueAnimationTransition,
} from 'motion/react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import type { Shot } from '../../lib/projects';
import { BLUR_UP, BlurImage, type BlurUpTuning } from './BlurImage';

interface Props {
	shots: Shot[];
	/* Touch layout: the card is sized by whatever box it is dropped into (the
	 * full page width minus the gutter) rather than the fixed Figma width, and
	 * the frame's height follows from the shot's own aspect ratio. */
	fluid?: boolean;
}

/* ─────────────────────────────────────────────────────────
 * SHOT STRIP STORYBOARD
 *
 * Every shot the card is showing sits on ONE strip, one frame width
 * apart, and a single spring moves the whole strip. Slides never
 * animate on their own.
 *
 *    0ms   current shot rests at x:0, filling the frame edge to edge
 *  next    a new shot joins the strip's right end, strip springs left
 *  prev    mirrored: joins the left end, strip springs right
 *  ~450ms  strip settles, no overshoot; shots out of view drop off
 *
 *  quick   a press mid-move retargets the same spring and keeps its
 *          speed. There is only one thing moving, so however fast you
 *          navigate, neighbouring shots stay joined.
 * ───────────────────────────────────────────────────────── */
const SLIDE = {
	// bounce: 0 = critically damped. The frame is edge-to-edge, so any
	// bounce past x:0 pulls the image off the rounded edge and blinks the
	// white card through for a frame — that was the jump at the tail.
	travel: { type: 'spring', visualDuration: 0.45, bounce: 0 } as const,
};

/* Frame geometry. `FRAME_WIDTH` is the Figma width of the desktop frame and the
 * fallback the strip uses until the frame has been measured — in `fluid` mode
 * the real width is whatever the container gives, so it is read off the DOM
 * instead of assumed.
 *
 * Neighbouring shots are separate absolutely-positioned layers, so if their
 * slots sat exactly one frame width apart they would *abut* — and at the
 * fractional positions a spring produces, the browser rasterizes each layer's
 * edge independently and the frame's white background leaks through the joint
 * as a 1px hairline. On light shots (Nova) it is invisible; on Nano's
 * near-black edges it reads as a bright divider sweeping across.
 *
 * Spacing the slots one pixel *less* than the frame width makes neighbours
 * share a constant 1px overlap, closing the joint, while the current shot
 * still comes to rest at exactly x:0, with no crop and no offset. */
const FRAME_WIDTH = 432;
const SEAM_OVERLAP = 1;

/* The ShotCard wrapper's outer width — must match `w-[464px]` below. Exported
 * so ProjectList knows the shared card's width for shot projects without
 * duplicating the constant. */
export const SHOT_CARD_WIDTH = 464;

const AUTO_ADVANCE_MS = 4000;

/* One shot's place on the strip. `slot` is its fixed position in frame widths.
 * `id` only ever increases, so it doubles as the React key (every shot that
 * joins is a fresh layer) and as the z-index (newest on top, so the 1px
 * overlap always hides the older shot's edge). */
interface StripLayer {
	id: number;
	shot: number;
	slot: number;
}

interface StripState {
	layers: StripLayer[];
	targetId: number; // the layer the strip is springing to: the current shot
	nextId: number;
}

const INITIAL_STRIP: StripState = {
	layers: [{ id: 0, shot: 0, slot: 0 }],
	targetId: 0,
	nextId: 1,
};

const targetOf = (strip: StripState): StripLayer =>
	strip.layers.find((layer) => layer.id === strip.targetId) ?? strip.layers[0];

/* Points the strip at `shot`, arriving from the `direction` side (+1 from the
 * right, -1 from the left). */
function stepStrip(strip: StripState, shot: number, direction: 1 | -1): StripState {
	const target = targetOf(strip);
	if (target.shot === shot) return strip;

	/* A quick change of mind: the shot is still on the strip on that side
	 * (usually the one just left), so spring back to it instead of adding a
	 * second copy. */
	const nearest = strip.layers
		.filter((layer) => layer.shot === shot && (layer.slot - target.slot) * direction > 0)
		.sort((a, b) => Math.abs(a.slot - target.slot) - Math.abs(b.slot - target.slot))[0];
	if (nearest) return { ...strip, targetId: nearest.id };

	/* Otherwise it joins the far end on that side, never a slot still in view,
	 * so a press back mid-move sweeps past the shot it just left rather than
	 * swapping that shot out while it is on screen. */
	const slots = strip.layers.map((layer) => layer.slot);
	const slot = direction > 0 ? Math.max(...slots) + 1 : Math.min(...slots) - 1;
	return {
		layers: [...strip.layers, { id: strip.nextId, shot, slot }],
		targetId: strip.nextId,
		nextId: strip.nextId + 1,
	};
}

/* ─────────────────────────────────────────────────────────
 * LOCKED SHOT — HOVER STORYBOARD
 *
 * Shots with no `href` (nothing to link out to — e.g. MorvaHR,
 * built under NDA) show a black scrim instead of being clickable.
 * A plain CSS group-hover fade, not Motion — no spring/timing choreography
 * here, just a two-state opacity toggle (also keyboard-reachable via
 * `group-focus-visible` on the tabIndex'd wrapper), so it doesn't need JS.
 *
 * Touch has no hover to fade on, so a press pins the same two states open and
 * a second press releases them — the CSS path is left untouched for pointers
 * that do hover.
 *
 *   rest    scrim hidden, shot shows plain
 *  hover    scrim fades in over the shot, message fades up with it
 *  press    same, held until pressed again (touch)
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
 * 61:1548). The card shell is provided by ProjectList; this renders the image
 * frame (rounded 6px, the Figma ring-and-drop shadow) whose image links out to
 * its Dribbble shot, plus a row of page-indicator dots overlaid near the
 * bottom. The frame is 432px wide on a hover pointer and fills its container
 * on touch (`fluid`); either way its height comes from the shot's own aspect
 * ratio, so the shot scales rather than crops.
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
export function ShotCard({ shots, fluid = false }: Props) {
	const reduceMotion = useReducedMotion();
	/* The strip (see stepStrip) and the shot it is springing to.
	 *
	 * The frame carries `isolate` so the layers' z-index values stay inside it.
	 * Otherwise they escape into the wrapper's stacking context and the slides
	 * start painting over the page-indicator dots, which sit below the frame in
	 * DOM order at z-index auto. */
	const [strip, setStrip] = useState(INITIAL_STRIP);
	const target = targetOf(strip);
	const index = target.shot;

	// Unique per card so multiple carousels don't share one global layoutId
	// (which would make their pills animate toward each other across the page).
	const pillId = useId();

	const dial = useDialKit('Shot Carousel', {
		travel: SLIDE.travel,
		glide: INDICATOR.glide,
		/* The shot's blur-up (see BlurImage). `hold` pins the placeholder up
		 * even after the shot has loaded, so it can be judged on its own; flip
		 * it back off to replay the reveal on an image that is already cached. */
		blurUp: {
			hold: false,
			placeholderBlur: [BLUR_UP.placeholderBlur, 0, 48],
			revealBlur: [BLUR_UP.revealBlur, 0, 32],
			reveal: BLUR_UP.reveal,
		},
	});

	/* DialKit widens its spring configs to a union that includes its own
	 * easing shape, so narrow back to Motion's Transition at the boundary. */
	const slide = dial.travel as Transition;
	const glide: Transition = reduceMotion ? { duration: 0 } : (dial.glide as Transition);
	const blurUp: BlurUpTuning = { ...dial.blurUp, reveal: dial.blurUp.reveal as Transition };

	/* The strip's position in frame widths: the current shot sits at x:0 when
	 * this equals minus its slot. `travel` is one slot in px. Both are motion
	 * values, so the move and a resize reach every slide without a re-render. */
	const position = useMotionValue(0);
	const travel = useMotionValue(FRAME_WIDTH - SEAM_OVERLAP);

	/* Auto-advance multi-shot carousels every 4s. Disabled for single shots
	 * and when the user prefers reduced motion. The interval is keyed on the
	 * current index, so any change — auto or manual — resets the full 4s. */
	// biome-ignore lint/correctness/useExhaustiveDependencies: `index` is unused in the body but deliberately kept as a dep so manual navigation (goTo) restarts the 5s timer, not just auto-advance.
	useEffect(() => {
		if (shots.length <= 1 || reduceMotion) return;
		const timer = setInterval(() => {
			setStrip((prev) => stepStrip(prev, (targetOf(prev).shot + 1) % shots.length, 1));
		}, AUTO_ADVANCE_MS);
		return () => clearInterval(timer);
	}, [shots.length, index, reduceMotion]);

	/* In `fluid` mode the frame width is set by the container, so a slot can't
	 * be a constant: it is measured off the frame and re-measured on
	 * rotate/resize. At the fixed desktop width this resolves to the same
	 * FRAME_WIDTH it always was. `offsetWidth`, not getBoundingClientRect(),
	 * because the shared card morphs by scaling, and a rect read mid-morph
	 * comes back scaled with it. */
	const frameRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame) return;

		const sync = () => travel.set(Math.max((frame.offsetWidth || FRAME_WIDTH) - SEAM_OVERLAP, 0));
		sync();

		const observer = new ResizeObserver(sync);
		observer.observe(frame);
		return () => observer.disconnect();
	}, [travel]);

	/* The DialKit spring as of the latest render, read when a move starts. Held
	 * in a ref so tweaking the panel (or any other re-render) never restarts a
	 * move already in flight. */
	const slideRef = useRef(slide);
	useEffect(() => {
		slideRef.current = slide;
	});

	/* Spring the strip to the current shot's slot. A press mid-move starts a
	 * new animation on the same value, which picks up its current speed, so the
	 * move bends toward the new shot instead of restarting. Once the strip
	 * lands, every shot but the current one is out of view and drops off. */
	const targetSlot = target.slot;

	useEffect(() => {
		const settle = () =>
			setStrip((prev) => (prev.layers.length === 1 ? prev : { ...prev, layers: [targetOf(prev)] }));

		if (reduceMotion) {
			position.jump(-targetSlot);
			settle();
			return;
		}

		const controls = animate(position, -targetSlot, {
			...(slideRef.current as ValueAnimationTransition<number>),
			onComplete: settle,
		});
		return () => controls.stop();
	}, [targetSlot, reduceMotion, position]);

	/* Touch has no hover, so the locked shot's scrim needs a press to appear and
	 * a second press to go away. On a hover pointer this stays closed and the
	 * CSS hover state does the work exactly as before.
	 *
	 * Held as the shot it was opened on rather than a boolean, so moving to
	 * another shot closes the scrim on its own — no effect chasing `index` to
	 * strand the message on the wrong image. */
	const [revealedIndex, setRevealedIndex] = useState<number | null>(null);

	const current = shots[index];
	if (!current) return null;

	const goTo = (i: number) =>
		setStrip((prev) => stepStrip(prev, i, i > targetOf(prev).shot ? 1 : -1));

	return (
		<div className={fluid ? 'w-full' : 'w-[464px]'}>
			<div className="relative p-4">
				<div
					ref={frameRef}
					className={`relative isolate overflow-hidden rounded-[6px] bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_3px_6px_-3px_rgba(0,0,0,0.1)] ${
						fluid ? 'w-full' : 'w-[432px]'
					}`}
					style={{ aspectRatio: `${current.width} / ${current.height}` }}
				>
					{strip.layers.map((layer) => {
						const shot = shots[layer.shot];
						if (!shot) return null;
						const revealed = revealedIndex === layer.shot;

						return (
							<StripSlide
								key={layer.id}
								position={position}
								travel={travel}
								slot={layer.slot}
								z={layer.id}
								inert={layer.id !== strip.targetId}
							>
								{shot.href ? (
									<a
										href={shot.href}
										target="_blank"
										rel="noopener noreferrer"
										className="block size-full"
									>
										<BlurImage
											src={shot.src}
											srcSet={shot.srcSet}
											alt={shot.alt}
											width={shot.width}
											height={shot.height}
											tuning={blurUp}
										/>
									</a>
								) : (
									<button
										type="button"
										aria-label={LOCKED.text}
										aria-expanded={revealed}
										onClick={() => setRevealedIndex(revealed ? null : layer.shot)}
										className="group relative block size-full cursor-default text-left"
									>
										<BlurImage
											src={shot.src}
											srcSet={shot.srcSet}
											alt={shot.alt}
											width={shot.width}
											height={shot.height}
											tuning={blurUp}
										/>
										<div
											className={`absolute inset-0 flex items-center justify-center bg-black/70 ${LOCKED.fade} ${
												revealed
													? 'opacity-100'
													: 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
											}`}
										>
											<p
												aria-hidden="true"
												className={`max-w-[280px] px-6 text-center text-sm text-white transition-[opacity,transform] duration-200 ease-out ${
													revealed
														? 'translate-y-0 opacity-100'
														: '-translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100'
												}`}
											>
												{LOCKED.text}
											</p>
										</div>
									</button>
								)}
							</StripSlide>
						);
					})}
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

interface StripSlideProps {
	position: MotionValue<number>;
	travel: MotionValue<number>;
	slot: number;
	z: number;
	inert: boolean;
	children: ReactNode;
}

/* One shot on the strip. Its x is derived from the strip's shared position
 * rather than animated on its own, which is what keeps neighbouring shots
 * joined: nothing can drift apart when only the strip moves. Every shot but
 * the current one is `inert`, so a stray press or tab stop never lands on a
 * shot on its way out. */
function StripSlide({ position, travel, slot, z, inert, children }: StripSlideProps) {
	const x = useTransform(() => (position.get() + slot) * travel.get());

	return (
		<motion.div
			inert={inert}
			style={{ x, zIndex: z, willChange: 'transform', backfaceVisibility: 'hidden' }}
			className="absolute inset-0 transform-gpu"
		>
			{children}
		</motion.div>
	);
}
