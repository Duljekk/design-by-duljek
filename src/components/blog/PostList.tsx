'use client';

import { motion, useReducedMotion } from 'motion/react';
import { fadeUp, staggerContainer, viewportOnce } from '../motion/variants';
import { Tag } from '../ui/Tag';

export interface PostSummary {
	slug: string;
	title: string;
	description: string;
	date: string;
	readingTime: number;
	tags: string[];
}

interface Props {
	posts: PostSummary[];
}

/* Listing rows for /blog. Same feel as the project list — each row lights up on
 * hover and the arrow slides in — but simpler: no shared floating card, since a
 * post row navigates rather than previews. */
export function PostList({ posts }: Props) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			className="flex flex-col"
			variants={staggerContainer}
			initial={reduceMotion ? 'visible' : 'hidden'}
			whileInView="visible"
			viewport={viewportOnce}
		>
			{posts.map((post) => (
				<motion.a
					key={post.slug}
					href={`/blog/${post.slug}`}
					variants={fadeUp}
					className="group flex flex-col gap-1.5 rounded-xl px-3 py-4 transition-colors duration-200 hover:bg-stone-100"
				>
					<div className="flex items-center gap-2">
						<h2 className="min-w-0 flex-1 text-base font-medium text-stone-900">{post.title}</h2>
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
					</div>
					<p className="text-base text-stone-600">{post.description}</p>
					<div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-base text-stone-500">
						<span>{post.date}</span>
						<span aria-hidden="true" className="text-stone-300">
							&middot;
						</span>
						<span>{post.readingTime} min read</span>
						{post.tags.length > 0 && (
							<span className="ml-1 flex flex-wrap gap-1.5">
								{post.tags.map((tag) => (
									<Tag key={tag}>{tag}</Tag>
								))}
							</span>
						)}
					</div>
				</motion.a>
			))}
		</motion.div>
	);
}
