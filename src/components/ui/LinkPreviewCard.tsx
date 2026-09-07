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
export function LinkPreviewCard({ preview, imageScale = 1, imageBoxHeight }: Props) {
	const scale = Math.min(Math.max(imageScale, 0.25), 1);

	return (
		<div style={{ width: CARD_WIDTH * scale }}>
			{preview.image && (
				/* The image bleeds to the card's edges and the slot takes its
				 * height from the image's own ratio — so scaling the card scales
				 * both, with no letterboxing either way. */
				<div
					className="w-full overflow-hidden border-b border-stone-200 bg-stone-100"
					style={imageBoxHeight ? { height: imageBoxHeight } : { aspectRatio: imageRatio(preview) }}
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
				</div>
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
