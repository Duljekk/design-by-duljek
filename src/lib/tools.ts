export interface Tool {
	name: string;
	icon: string;
	/* The icon SVG's own intrinsic width/height (its viewBox size), so
	 * ToolItem can set them as HTML attributes and reserve layout space
	 * before the SVG loads — avoids a CLS hit on first paint. */
	iconWidth: number;
	iconHeight: number;
	/* Shown in the hover card under the name. Leave empty to show the name
	 * alone — the card renders the description only when one is present. */
	description: string;
	/* Chip fill / border colours (Figma 11:443), as hex — the source of truth
	 * for the per-chip DialKit sections. Omit both for self-contained logos
	 * like Jitter that carry their own tile. */
	background?: string;
	border?: string;
	/* Inner bottom highlight opacity (Figma inset shadow). Defaults to 0.2;
	 * lighter chips use a softer value. */
	highlight?: number;
	/* rgb triplet the highlight is mixed from. Defaults to white (the
	 * top-sheen dark chips get); white-background chips (Figma 126:12832)
	 * use black instead, for a recessed shadow rather than a sheen. */
	highlightRgb?: string;
}

export const tools: Tool[] = [
	{
		name: 'Figma',
		icon: 'figma.svg',
		iconWidth: 12,
		iconHeight: 18,
		description: 'Where every screen gets figured out before it gets built.',
		background: '#000000',
		border: '#1a1a1a',
	},
	{
		name: 'Claude',
		icon: 'claude.svg',
		iconWidth: 20,
		iconHeight: 19.9485,
		description: 'My partner for thinking through ideas and writing code.',
		background: '#d97757',
		border: '#c36b4e',
		highlight: 0.15,
	},
	{
		name: 'MCP',
		icon: 'mcp.svg',
		iconWidth: 16.9053,
		iconHeight: 18.8421,
		description: 'The protocol that lets Claude reach my tools and files.',
		background: '#FFFFFF',
		border: '#e4e4e7',
		highlight: 0.08,
		highlightRgb: '0,0,0',
	},
	{
		name: 'Framer',
		icon: 'framer.svg',
		iconWidth: 11.96,
		iconHeight: 18,
		description: 'Where most of my ideas go from static to shippable.',
		background: '#000000',
		border: '#1a1a1a',
	},
	{
		name: 'Supabase',
		icon: 'supabase.svg',
		iconWidth: 17.5244,
		iconHeight: 18,
		description: 'Backend and auth, handled without slowing me down.',
		background: '#1c1c1c',
		border: '#333333',
	},
	{
		name: 'Cursor',
		icon: 'cube.svg',
		iconWidth: 16,
		iconHeight: 18.2404,
		description: 'My partner for writing and shipping code.',
		background: '#000000',
		border: '#1a1a1a',
	},
	{
		name: 'Tailwind CSS',
		icon: 'tailwind.svg',
		iconWidth: 20.1058,
		iconHeight: 12,
		description: 'Every design decision, one utility class away from shipped.',
		background: '#FFFFFF',
		border: '#e4e4e7',
		highlight: 0.08,
		highlightRgb: '0,0,0',
	},
	{
		name: 'Jitter',
		icon: 'jitter.svg',
		iconWidth: 32,
		iconHeight: 33,
		description: 'For motion that makes interfaces feel alive.',
		border: '#6E3AD5',
		highlight: 0.15,
	},
	{
		name: 'Vercel',
		icon: 'vercel.svg',
		iconWidth: 16.1,
		iconHeight: 14,
		description: 'Ship it, see it live, iterate.',
		background: '#000000',
		border: '#1a1a1a',
	},
];
