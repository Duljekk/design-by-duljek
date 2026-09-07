export interface SocialLink {
	name: string;
	href: string;
	icon: string;
	/* The icon SVG's own intrinsic width/height (its viewBox size), so
	 * SocialIcon can set them as HTML attributes and reserve layout space
	 * before the SVG loads — avoids a CLS hit on first paint. */
	iconWidth: number;
	iconHeight: number;
}

/* Footer social row (Figma 39:27). Each icon sits in a shared 32px slot;
 * the leaf keeps its own designed size, so the marks stay optically even
 * rather than being stretched to a single box. */
export const socialLinks: SocialLink[] = [
	{
		name: 'GitHub',
		href: 'https://github.com/Duljekk',
		icon: 'github.svg',
		iconWidth: 20,
		iconHeight: 19.3726,
	},
	{
		name: 'Email',
		href: 'mailto:abdulzakisr@gmail.com',
		icon: 'gmail.svg',
		iconWidth: 20.1258,
		iconHeight: 16,
	},
	{
		name: 'Instagram',
		href: 'https://www.instagram.com/abdulzakisr',
		icon: 'instagram.svg',
		iconWidth: 18,
		iconHeight: 18,
	},
	{
		name: 'LinkedIn',
		href: 'https://www.linkedin.com/in/abdulzakisr',
		icon: 'linkedin.svg',
		iconWidth: 32,
		iconHeight: 32,
	},
	{
		name: 'WhatsApp',
		href: 'https://wa.me/6282121254440',
		icon: 'whatsapp.svg',
		iconWidth: 18,
		iconHeight: 18,
	},
];
