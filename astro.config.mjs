// @ts-check

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://design-by-duljek.site',

	vite: {
		plugins: [tailwindcss()],
	},

	integrations: [react(), sitemap()],

	adapter: vercel(),

	server: {
		host: true,
	},
});
