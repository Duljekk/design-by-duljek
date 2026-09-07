import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* Blog posts live as Markdown in src/content/blog. The glob loader gives each
 * entry an `id` equal to its filename (used as the URL slug). Figma is still the
 * source of truth for visuals; this collection only owns the content shape. */
const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog };
// touch: register blog collection
