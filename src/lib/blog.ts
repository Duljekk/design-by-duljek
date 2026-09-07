import { type CollectionEntry, getCollection } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

const WORDS_PER_MINUTE = 200;

/* Draft posts are hidden in production but visible while developing so they can
 * be previewed before publish. */
export async function getPublishedPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function readingTime(body: string | undefined): number {
	if (!body) return 1;
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
});

export function formatDate(date: Date): string {
	return dateFormatter.format(date);
}
