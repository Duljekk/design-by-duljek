'use client';

import { motion, type Transition, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Shot } from '../../lib/projects';

/* ─────────────────────────────────────────────────────────
 * SHOT LIGHTBOX — MORPH STORYBOARD
 *
 * The shot does not get a copy of itself opened over the page: the image that
 * is already on screen lifts off the card and grows into place, the same way
 * the shared card warps between rows.
 *
 *    0ms   overlay mounts with the shot exactly on top of its thumbnail (same
 *          rect, same 6px corners), so the swap is invisible; the thumbnail
 *          hides underneath
 *    0ms   scrim fades in, shot springs to its centred fit, corners open to 12
 *  ~180ms  close button fades in
 *   load   the high-res file fades in over the 1x that is already showing
 *  close   Escape, the scrim, the shot or the button: shot springs back onto
 *          its thumbnail (re-measured, the page may have scrolled) on the same
 *          spring, no bounce; scrim and button fade out, and the thumbnail is
 *          handed back only once the shot has landed
 *
 *  reduced motion: no travel, the shot and scrim only fade
 * ───────────────────────────────────────────────────────── */
const LIGHTBOX = {
	/* bounce: 0 = critically damped, like every other morph on the site. Any
	 * overshoot would push the shot past its fit or off its thumbnail's edge. */
	/* Fallback for the DialKit spring ProjectList passes in. */
	travel: { type: 'spring', visualDuration: 0.5, bounce: 0 } as Transition,
	scrim: { duration: 0.24, ease: 'easeOut' } as Transition,
	control: { duration: 0.18, ease: 'easeOut', delay: 0.18 } as Transition,
	fullRes: { duration: 0.3, ease: 'easeOut' } as Transition,
	reduced: { duration: 0.15, ease: 'easeOut' } as Transition,
	/* px. The thumbnail's own radius, and the radius the shot grows to. */
	radiusFrom: 6,
	radiusTo: 12,
	margin: 32, // px of breathing room between the shot and the viewport edge
};

export interface LightboxRequest {
	shot: Shot;
	source: HTMLElement;
}

interface Props {
	request: LightboxRequest | null;
	/* The shot's spring, out to its fit and back onto its thumbnail. */
	travel: Transition;
	onClosed: () => void;
}

interface Viewport {
	width: number;
	height: number;
}

const readViewport = (): Viewport => ({
	width: window.innerWidth,
	height: window.innerHeight,
});

/* The largest box with the shot's aspect ratio that fits inside the margin. */
function fit(shot: Shot, viewport: Viewport) {
	const scale = Math.min(
		(viewport.width - LIGHTBOX.margin * 2) / shot.width,
		(viewport.height - LIGHTBOX.margin * 2) / shot.height,
	);
	const width = shot.width * scale;
	const height = shot.height * scale;
	return {
		width,
		height,
		x: (viewport.width - width) / 2,
		y: (viewport.height - height) / 2,
	};
}

export function ShotLightbox({ request, onClosed, ...rest }: Props) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted || !request) return null;
	return createPortal(
		<LightboxLayer key={request.shot.src} request={request} onClosed={onClosed} {...rest} />,
		document.body,
	);
}

function LightboxLayer({
	request,
	travel: spring,
	onClosed,
}: Omit<Props, 'request'> & { request: LightboxRequest }) {
	const { shot, source } = request;
	const reduceMotion = useReducedMotion();
	const closeRef = useRef<HTMLButtonElement>(null);

	const [viewport, setViewport] = useState<Viewport>(readViewport);
	/* Where the shot sits when it is "closed": the thumbnail's rect, measured
	 * now and again at the moment of closing. */
	const [origin, setOrigin] = useState(() => source.getBoundingClientRect());
	const [open, setOpen] = useState(true);
	const [fullLoaded, setFullLoaded] = useState(false);

	const target = fit(shot, viewport);
	const closedScale = origin.width / target.width;

	const close = () => {
		if (!open) return;
		if (source.isConnected) setOrigin(source.getBoundingClientRect());
		setOpen(false);
	};

	useEffect(() => {
		const onResize = () => setViewport(readViewport());
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				close();
			}
			/* Nothing else in the dialog takes focus, so Tab stays on the button. */
			if (event.key === 'Tab') {
				event.preventDefault();
				closeRef.current?.focus();
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	});

	useLayoutEffect(() => {
		closeRef.current?.focus({ preventScroll: true });
	}, []);

	const travel = reduceMotion ? LIGHTBOX.reduced : spring;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={shot.alt}
			className="fixed inset-0 z-50 overscroll-contain"
		>
			<motion.div
				aria-hidden="true"
				className="absolute inset-0 cursor-zoom-out bg-stone-950/70 backdrop-blur-sm"
				initial={{ opacity: 0 }}
				animate={{ opacity: open ? 1 : 0 }}
				transition={reduceMotion ? LIGHTBOX.reduced : LIGHTBOX.scrim}
				onClick={close}
			/>

			<motion.button
				ref={closeRef}
				type="button"
				aria-label="Close"
				onClick={close}
				className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
				initial={{ opacity: 0 }}
				animate={{ opacity: open ? 1 : 0 }}
				transition={open && !reduceMotion ? LIGHTBOX.control : LIGHTBOX.reduced}
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 16 16"
					className="size-4"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
				>
					<path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
				</svg>
			</motion.button>

			{/* Laid out at its final size and moved by transform only: the morph
			    is a translate + uniform scale from the thumbnail's rect, never a
			    width/height animation. The radius is animated in the shot's own
			    (unscaled) units so it reads 6px on the thumbnail and 12px open. */}
			<motion.div
				className="absolute top-0 left-0 origin-top-left cursor-zoom-out overflow-hidden bg-stone-900"
				style={{ width: target.width, height: target.height, willChange: 'transform' }}
				initial={
					reduceMotion
						? { x: target.x, y: target.y, scale: 1, opacity: 0, borderRadius: LIGHTBOX.radiusTo }
						: {
								x: origin.left,
								y: origin.top,
								scale: closedScale,
								borderRadius: LIGHTBOX.radiusFrom / closedScale,
							}
				}
				animate={
					open
						? { x: target.x, y: target.y, scale: 1, opacity: 1, borderRadius: LIGHTBOX.radiusTo }
						: reduceMotion
							? { opacity: 0 }
							: {
									x: origin.left,
									y: origin.top,
									scale: closedScale,
									borderRadius: LIGHTBOX.radiusFrom / closedScale,
								}
				}
				transition={travel}
				onClick={close}
				/* Only the animation that lands the shot back counts. Completion also
				 * reports the opening animation and sub-animations like the radius,
				 * which closed the lightbox a frame after the press, before the
				 * shot had gone anywhere. */
				onAnimationComplete={(definition) => {
					if (open || typeof definition !== 'object' || Array.isArray(definition)) return;
					const landed = reduceMotion ? definition.opacity === 0 : definition.x === origin.left;
					if (landed) onClosed();
				}}
			>
				<img
					src={shot.src}
					srcSet={shot.srcSet}
					alt=""
					width={shot.width}
					height={shot.height}
					className="absolute inset-0 size-full object-cover"
				/>
				{shot.full && (
					<motion.img
						src={shot.full}
						alt={shot.alt}
						width={shot.width}
						height={shot.height}
						decoding="async"
						className="absolute inset-0 size-full object-cover"
						initial={{ opacity: 0 }}
						animate={{ opacity: fullLoaded ? 1 : 0 }}
						transition={LIGHTBOX.fullRes}
						onLoad={(event) => {
							event.currentTarget
								.decode()
								.catch(() => undefined)
								.then(() => setFullLoaded(true));
						}}
					/>
				)}
			</motion.div>
		</div>
	);
}
