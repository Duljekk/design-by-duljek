'use client';

import { motion, useReducedMotion } from 'motion/react';
import { fadeUp, staggerContainer, viewportOnce } from '../motion/variants';
import { SectionHeading } from '../ui/SectionHeading';

export interface WritingItem {
	slug: string;
	title: string;
	date: string;
}

interface Props {
	items: WritingItem[];
}

/* Home-page teaser for the blog. Compact title + date rows in the same visual
 * language as the project list, capped off with a link into /blog so the
 * section doubles as the site's route into writing. */
export function Writing({ items }: Props) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.section
			className="flex flex-col gap-4.5"
			variants={staggerContainer}
			initial={reduceMotion ? 'visible' : 'hidden'}
			whileInView="visible"
			viewport={viewportOnce}
		>
			<motion.div className="px-3" variants={fadeUp}>
				<SectionHeading title="Writing">
					Tips, tricks, and notes on design, motion, and building for the web
				</SectionHeading>
			</motion.div>

			<div className="flex flex-col">
				{items.map((item) => (
					<motion.a
						key={item.slug}
						href={`/blog/${item.slug}`}
						variants={fadeUp}
						className="group flex items-center rounded-xl py-2.5 pr-3.5 pl-3 transition-colors duration-200 hover:bg-stone-100"
					>
						<div className="flex min-w-0 flex-1 flex-col">
							<p className="text-base font-medium text-stone-900">{item.title}</p>
							<p className="text-base text-stone-500">{item.date}</p>
						</div>
						<svg
							width={16}
							height={16}
							viewBox="0 0 16 16"
							fill="none"
							aria-hidden="true"
							className="size-4 shrink-0 -translate-x-1 text-stone-400 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
						>
							<path
								d="M6 4l4 4-4 4"
								stroke="currentColor"
								strokeWidth={1.5}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</motion.a>
				))}

				<motion.a
					href="/blog"
					variants={fadeUp}
					className="group inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-base text-stone-500 transition-colors hover:text-stone-900"
				>
					All writing
					<svg
						width={16}
						height={16}
						viewBox="0 0 16 16"
						fill="none"
						aria-hidden="true"
						className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
					>
						<path
							d="M6 4l4 4-4 4"
							stroke="currentColor"
							strokeWidth={1.5}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</motion.a>
			</div>
		</motion.section>
	);
}
