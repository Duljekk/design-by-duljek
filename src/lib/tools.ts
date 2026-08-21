export interface Tool {
	name: string;
	icon: string;
	/* Shown in the hover card under the name. Leave empty to show the name
	 * alone — the card renders the description only when one is present. */
	description: string;
	background?: string;
}

export const tools: Tool[] = [
	{ name: 'Framer', icon: 'framer.svg', description: '', background: 'bg-black' },
	{ name: 'Claude', icon: 'claude.svg', description: '', background: 'bg-[#d97757]' },
	{ name: 'MCP', icon: 'mcp.svg', description: '', background: 'bg-white' },
	{ name: 'Three.js', icon: 'cube.svg', description: '', background: 'bg-black' },
	{ name: 'Jitter', icon: 'jitter.svg', description: '' },
	{ name: 'Supabase', icon: 'supabase.svg', description: '', background: 'bg-[#1c1c1c]' },
	{ name: 'Tailwind', icon: 'tailwind.svg', description: '', background: 'bg-white' },
	{ name: 'Vercel', icon: 'vercel.svg', description: '', background: 'bg-black' },
];
