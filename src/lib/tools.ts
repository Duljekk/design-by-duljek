export interface Tool {
	name: string;
	icon: string;
	background?: string;
}

export const tools: Tool[] = [
	{ name: 'Figma', icon: 'figma.svg', background: 'bg-black' },
	{ name: 'Framer', icon: 'framer.svg', background: 'bg-[#d97757]' },
	{ name: 'Figma', icon: 'figma.svg', background: 'bg-black' },
	{ name: 'Chainlink', icon: 'chain.svg', background: 'bg-white' },
	{ name: 'Three.js', icon: 'cube.svg', background: 'bg-black' },
	{ name: 'Motion', icon: 'motion.svg' },
	{ name: 'Supabase', icon: 'supabase.svg', background: 'bg-[#1c1c1c]' },
	{ name: 'Tailwind', icon: 'tailwind.svg', background: 'bg-white' },
	{ name: 'Vercel', icon: 'vercel.svg', background: 'bg-black' },
];
