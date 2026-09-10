import { motion, type Transition } from 'motion/react';
import type { RefObject } from 'react';

export interface LinkPreview {
	url: string;
	domain: string;
	title: string;
	description?: string;
	/* Absent when the target site publishes no og:image — the card then
	 * renders text-only rather than reserving an empty image slot. */
	image?: string;
	imageWidth?: number;
	imageHeight?: number;
	favicon?: string;
	fetchedAt: string;
}

/* The card's rendered width for a given image scale — exported so ProjectList
 * knows how wide each project's card is without dupliciting the math. */
export function previewCardWidth(imageScale?: number) {
	const scale = Math.min(Math.max(imageScale ?? 1, 0.25), 1);
	return CARD_WIDTH * scale;
}

interface Props {
	preview: LinkPreview;
	/* Scales the whole card, image and text alike. 1 (default) is the full
	 * 320px width; below that the card narrows with the image, so a logo-style
	 * OG doesn't dominate the row it floats above. */
	imageScale?: number;
	/* Pins the OG container to this many px instead of letting the image's own
	 * ratio set it — for images whose natural shape makes too tall a card. The
	 * image still fills the width and crops to fit. */
	imageBoxHeight?: number;
	/* Morph language for the og:image — the one piece of the card that
	 * participates in the shared card's warp. It scales UNIFORMLY (width and
	 * height together, so its aspect ratio is never broken):
	 *   entering — from `from` (the outgoing card's width / this card's
	 *     width) to `to`, on the shell's warp spring, landing in lockstep with
	 *     the frame's width warp.
	 *   exiting — toward `exitScaleRef.current` (the incoming card's width /
	 *     this card's), so the outgoing image grows or shrinks WITH the frame
	 *     as it blurs out instead of resting at its own size under a box that
	 *     has moved on. Passed as a ref because AnimatePresence freezes the
	 *     exiting body's props — the ref object is stable, so `.current` is
	 *     read fresh when the exit begins.
	 * The text block never participates in either direction — the body
	 * counter-scales it. */
	imageMorph?: { from: number; to: number; spring: Transition };
	exitScaleRef?: RefObject<number>;
}

/* 40/21 is the 1200x630 OG standard, used when a site ships no dimensions.
 * Taller images (square icons, portrait art) are allowed down to 1/1 so they
 * aren't cropped to a letterbox, but never taller than the card is wide. */
const DEFAULT_RATIO = 40 / 21;
const MIN_RATIO = 1;
const CARD_WIDTH = 320; // px, the w-80 the unscaled card has always been

function imageRatio({ imageWidth, imageHeight }: LinkPreview) {
	if (!imageWidth || !imageHeight) return DEFAULT_RATIO;
	return Math.min(Math.max(imageWidth / imageHeight, MIN_RATIO), 3);
}

/* Content only — the shared card shell (border, radius, shadow) is provided
 * by ProjectList's single morphing overlay. */
export function LinkPreviewCard({
	preview,
	imageScale = 1,
	imageBoxHeight,
	imageMorph,
	exitScaleRef,
}: Props) {
	const scale = Math.min(Math.max(imageScale, 0.25), 1);
	const morphing = imageMorph !== undefined && imageMorph.from !== 1;

	return (
		<div style={{ width: CARD_WIDTH * scale }}>
			{preview.image && (
				/* The image bleeds to the card's edges and the slot takes its
				 * height from the image's own ratio — so scaling the card scales
				 * both, with no letterboxing either way. During a morph the slot
				 * runs a uniform scale (see `imageMorph`) — origin top-left keeps
				 * the image glued to the frame's fixed left edge while it settles;
				 * the transient vertical overshoot hides under the body's blur. */
				<motion.div
					initial={morphing && imageMorph ? { scale: imageMorph.from } : false}
					animate={{ scale: imageMorph?.to ?? 1 }}
					/* On a row-to-row move the outgoing image scales toward the
					 * NEXT card's width factor. A function variant, so the target
					 * resolves when the exit begins (fresh ref read) rather than
					 * when AnimatePresence froze this body's props. */
					exit={exitScaleRef ? 'resizeOut' : undefined}
					variants={{ resizeOut: () => ({ scale: exitScaleRef?.current ?? 1 }) }}
					transition={imageMorph?.spring}
					style={{
						transformOrigin: '0 0',
						...(imageBoxHeight ? { height: imageBoxHeight } : { aspectRatio: imageRatio(preview) }),
					}}
					className="w-full overflow-hidden border-b border-stone-200 bg-stone-100"
				>
					<img
						src={preview.image}
						alt=""
						width={preview.imageWidth ?? 1200}
						height={preview.imageHeight ?? 630}
						loading="lazy"
						decoding="async"
						className="size-full object-cover"
					/>
				</motion.div>
			)}
			<div className="flex flex-col gap-1 p-3">
				<div className="flex items-center gap-1.5">
					{preview.favicon && (
						<img
							src={preview.favicon}
							alt=""
							width={12}
							height={12}
							loading="lazy"
							decoding="async"
							className="size-3 shrink-0 rounded-[2px]"
						/>
					)}
					<span className="truncate text-sm text-stone-500">{preview.domain}</span>
				</div>
				<p className="line-clamp-2 text-sm font-medium text-stone-900">{preview.title}</p>
				{preview.description && (
					<p className="line-clamp-2 text-sm text-stone-500">{preview.description}</p>
				)}
			</div>
		</div>
	);
}
