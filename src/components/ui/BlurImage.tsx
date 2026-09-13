'use client';

import { motion, type Transition, useReducedMotion } from 'motion/react';
import { type SyntheticEvent, useLayoutEffect, useRef, useState } from 'react';
import { placeholderFor } from '../../lib/placeholders';

/* ─────────────────────────────────────────────────────────
 * BLUR-UP STORYBOARD
 *
 * `load` is whenever THIS <img> element has its pixels (downloaded and
 * decoded), not a fixed time. Everything after it is relative to that moment.
 *
 *      0ms   frame mounts with the placeholder already in it: a 32px-wide
 *            copy of the image inlined in the bundle, stretched to fill and
 *            blurred 16px, so the frame is never an empty box
 *     load   full-res fades up over it, pulling focus blur 8px → 0
 *   +500ms   full-res settled, fully opaque
 *   +700ms   placeholder cleared from underneath (only ever visible
 *            through an image with transparent areas)
 *
 *   cached   an image that loads within 120ms of mounting came straight from
 *            the browser's cache and nobody saw a wait, so it is swapped in
 *            at once instead of replaying the reveal
 *  reduced   opacity only, no focus pull
 * ───────────────────────────────────────────────────────── */
export const BLUR_UP = {
	placeholderBlur: 16, // px, melts the upscaled 32px grid into a wash of the image's colours
	revealBlur: 8, // px the full-res starts at, so it resolves into focus instead of popping in
	/* bounce: 0, critically damped. Any overshoot reads as the image
	 * flickering in and out of focus at the tail of the reveal. */
	reveal: { type: 'spring', visualDuration: 0.5, bounce: 0 } as const,
	instantWindow: 120, // ms after mount inside which a load counts as cached
	swap: { duration: 0 } as const, // a cached image: straight in, no reveal
	clear: { duration: 0.2, ease: 'easeOut' } as const, // placeholder leaving from under the settled image
	reducedReveal: { duration: 0.2, ease: 'easeOut' } as const, // reduced motion: a plain crossfade
};

export interface BlurUpTuning {
	hold: boolean; // keep the placeholder up after load, a DialKit aid for judging it on its own
	placeholderBlur: number;
	revealBlur: number;
	reveal: Transition;
}

const DEFAULT_TUNING: BlurUpTuning = {
	hold: false,
	placeholderBlur: BLUR_UP.placeholderBlur,
	revealBlur: BLUR_UP.revealBlur,
	reveal: BLUR_UP.reveal,
};

interface Props {
	src: string;
	srcSet?: string;
	alt: string;
	width: number;
	height: number;
	/* Live DialKit values while tuning; everyone else gets BLUR_UP. */
	tuning?: BlurUpTuning;
}

/* An image that is never an empty box. It fills its container (object-cover),
 * paints its build-time placeholder the moment it mounts, and brings the real
 * image in over it once that has loaded. An image with no generated
 * placeholder degrades to the container's own background, as before. */
export function BlurImage({ src, srcSet, alt, width, height, tuning = DEFAULT_TUNING }: Props) {
	const reduceMotion = useReducedMotion();
	const imgRef = useRef<HTMLImageElement>(null);
	const placeholder = placeholderFor(src);
	const [mountedAt] = useState(() => performance.now());

	/* Readiness belongs to this <img> element, never to the URL. Having shown
	 * an image earlier in the visit does not mean a fresh element for it can
	 * paint now: a remounted carousel slide still waits on the cache or a
	 * revalidation, and revealing it early leaves an empty frame, placeholder
	 * already gone, until its pixels arrive. */
	const [arrival, setArrival] = useState<{ src: string; instant: boolean } | null>(null);
	/* The placeholder only clears once the reveal has fully landed. Fading both
	 * layers at once would pass through a see-through midpoint where the
	 * frame's own background dims the image mid-reveal. */
	const [settled, setSettled] = useState(false);

	const loaded = arrival?.src === src;
	const revealed = loaded && !tuning.hold;

	/* Holding the placeholder turns a cached swap into a real reveal, so
	 * releasing Hold in DialKit still replays the animation. */
	if (tuning.hold && arrival?.instant) setArrival({ ...arrival, instant: false });

	/* An image the browser can hand over synchronously (memory cache, or one
	 * that finished before hydration) is complete before the first paint.
	 * Catching it here swaps it in on that frame rather than after onLoad. */
	useLayoutEffect(() => {
		const img = imgRef.current;
		if (img?.complete && img.naturalWidth > 0) setArrival({ src, instant: true });
	}, [src]);

	/* Waits for decode as well as load: starting the fade on a large image
	 * that has not been decoded yet drops a frame right at the start. */
	const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
		const instant = performance.now() - mountedAt < BLUR_UP.instantWindow;
		event.currentTarget
			.decode()
			.catch(() => undefined)
			.then(() => setArrival((prev) => (prev?.src === src ? prev : { src, instant })));
	};

	/* Blur feathers the placeholder's edges toward transparent over roughly
	 * twice its radius. Pushing the layer that far past the frame on every side
	 * (the wrapper clips it) keeps that soft rim out of sight at any size. */
	const overscan = tuning.placeholderBlur * 2;

	/* Settles on `filter: none`, not a resting blur(0px). Any filter makes the
	 * image its own raster surface, and inside a ShotCard slide sitting at a
	 * fractional x that surface's edge stops meeting the neighbouring slide's,
	 * reopening the 1px seam SEAM_OVERLAP exists to close. */
	const variants = {
		hidden: { opacity: 0, filter: `blur(${reduceMotion ? 0 : tuning.revealBlur}px)` },
		shown: { opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
	};

	const transition = reduceMotion
		? BLUR_UP.reducedReveal
		: arrival?.instant
			? BLUR_UP.swap
			: tuning.reveal;

	return (
		<span className="relative block size-full overflow-hidden">
			{placeholder && (
				<motion.span
					aria-hidden="true"
					className="absolute bg-cover bg-center"
					style={{
						inset: `${-overscan}px`,
						backgroundImage: `url(${placeholder})`,
						filter: `blur(${tuning.placeholderBlur}px)`,
					}}
					initial={false}
					animate={{ opacity: revealed && settled ? 0 : 1 }}
					transition={BLUR_UP.clear}
				/>
			)}
			<motion.img
				ref={imgRef}
				src={src}
				srcSet={srcSet}
				alt={alt}
				width={width}
				height={height}
				/* No `loading="lazy"`: this only mounts when its image is about to
				 * be seen, and a lazy image clipped just off-frame (a slide at the
				 * start of its entrance) would not start fetching until it slid in. */
				decoding="async"
				onLoad={handleLoad}
				className="relative block size-full object-cover"
				variants={variants}
				initial="hidden"
				animate={revealed ? 'shown' : 'hidden'}
				transition={transition}
				onAnimationComplete={(definition) => setSettled(definition === 'shown')}
			/>
		</span>
	);
}
