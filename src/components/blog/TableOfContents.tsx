'use client';

import { useEffect, useState } from 'react';

export interface TocItem {
	depth: number;
	slug: string;
	text: string;
}

interface Props {
	items: TocItem[];
}

const TOP_OFFSET = 96; // px — a heading is "active" once it passes below the sticky nav

/* Scroll-spy table of contents. Renders twice: an inline card on narrow screens
 * and a fixed rail in the right margin on xl (which keeps the article column
 * dead-centre, matching the rest of the site). Both share one active-id state.
 * Only h2/h3 are listed so the outline stays shallow and scannable. */
export function TableOfContents({ items }: Props) {
	const headings = items.filter((item) => item.depth === 2 || item.depth === 3);
	const [activeSlug, setActiveSlug] = useState<string>(headings[0]?.slug ?? '');

	useEffect(() => {
		if (headings.length === 0) return;

		const elements = headings
			.map((h) => document.getElementById(h.slug))
			.filter((el): el is HTMLElement => el !== null);

		let frame = 0;
		const update = () => {
			frame = 0;
			let current = elements[0]?.id ?? '';
			for (const el of elements) {
				if (el.getBoundingClientRect().top - TOP_OFFSET <= 1) current = el.id;
				else break;
			}
			setActiveSlug(current);
		};

		const onScroll = () => {
			if (frame) return;
			frame = requestAnimationFrame(update);
		};

		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	}, [headings.length]);

	if (headings.length === 0) return null;

	const list = (
		<ul className="flex flex-col gap-0.5">
			{headings.map((item) => {
				const active = item.slug === activeSlug;
				return (
					<li key={item.slug}>
						<a
							href={`#${item.slug}`}
							className={[
								'block rounded-md py-1 text-sm transition-colors',
								item.depth === 3 ? 'pl-5' : 'pl-3',
								active ? 'text-stone-900' : 'text-stone-500 hover:text-stone-800',
							].join(' ')}
							aria-current={active ? 'location' : undefined}
						>
							<span
								className={[
									'-ml-3 mr-2 inline-block h-3 w-0.5 translate-y-0.5 rounded-full transition-colors',
									active ? 'bg-stone-900' : 'bg-transparent',
								].join(' ')}
								aria-hidden="true"
							/>
							{item.text}
						</a>
					</li>
				);
			})}
		</ul>
	);

	const heading = (
		<p className="mb-2 pl-3 text-sm font-medium tracking-wide text-stone-400 uppercase">
			On this page
		</p>
	);

	return (
		<>
			{/* Inline card — narrow screens */}
			<nav
				aria-label="Table of contents"
				className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 xl:hidden"
			>
				{heading}
				{list}
			</nav>

			{/* Fixed rail — xl and up, sitting in the right margin of the centred column */}
			<nav
				aria-label="Table of contents"
				className="fixed top-28 left-[calc(50%+23rem)] hidden max-h-[70vh] w-52 overflow-auto xl:block"
			>
				{heading}
				{list}
			</nav>
		</>
	);
}
