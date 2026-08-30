export interface Tool {
	name: string;
	icon: string;
	/* Shown in the hover card under the name. Leave empty to show the name
	 * alone — the card renders the description only when one is present. */
	description: string;
	background?: string;
}

export const tools: Tool[] = [
	{ name: 'Framer', icon: 'framer.svg', description: 'Where most of my ideas go from static to shippable.', background: 'bg-black' },
	{ name: 'Claude', icon: 'claude.svg', description: 'My partner for thinking through ideas and writing code.', background: 'bg-[#d97757]' },
	{ name: 'MCP', icon: 'mcp.svg', description: 'Connects my tools together so ideas move faster.', background: 'bg-white' },
	{ name: 'Cursor', icon: 'cube.svg', description: 'My partner for writing and shipping code.', background: 'bg-black' },
	{ name: 'Jitter', icon: 'jitter.svg', description: 'For motion that makes interfaces feel alive.' },
	{ name: 'Supabase', icon: 'supabase.svg', description: 'Backend and auth, handled without slowing me down.', background: 'bg-[#1c1c1c]' },
	{ name: 'Tailwind', icon: 'tailwind.svg', description: 'Fast, consistent styling without leaving the code.', background: 'bg-white' },
	{ name: 'Vercel', icon: 'vercel.svg', description: 'Ship it, see it live, iterate.', background: 'bg-black' },
];
