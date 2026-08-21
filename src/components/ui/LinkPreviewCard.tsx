'use client';

import { HoverCard } from './HoverCard';

export interface LinkPreview {
	url: string;
	domain: string;
	title: string;
	description?: string;
	/* Absent when the target site publishes no og:image — the card then
	 * renders text-only rather than reserving an empty image slot. */
	image?: string;
	favicon?: string;
	fetchedAt: string;
}

interface Props {
	preview: LinkPreview;
}

export function LinkPreviewCard({ preview }: Props) {
	return (
		<HoverCard className="w-80">
			{/* 40/21 is the 1200x630 OG standard — aspect-video (16/9) crops it. */}
			{preview.image && (
				<div className="aspect-[40/21] w-full overflow-hidden border-b border-stone-200 bg-stone-100">
					<img
						src={preview.image}
						alt=""
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
		</HoverCard>
	);
}
