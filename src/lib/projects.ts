import data from './projects.json';

export interface Shot {
	src: string;
	srcSet?: string;
	width: number;
	height: number;
	alt: string;
	href?: string;
}

/* Past Works are split across a tab strip; every entry there carries one. */
export type ProjectCategory = 'product' | 'web';

export interface Project {
	title: string;
	date: string;
	category?: ProjectCategory;
	href?: string;
	/* Overrides the scraped og:image for this link — a file in public/, used
	 * when the target site publishes none or a poor one. */
	previewImage?: string;
	/* Fraction of the preview card's width the og:image fills. Below 1 it sits
	 * centred and padded — right for logo-style images that look overblown
	 * bleeding edge to edge. */
	previewImageScale?: number;
	/* Pins the preview card's og:image container to this height in px, instead
	 * of deriving it from the image's own aspect ratio. */
	previewImageHeight?: number;
	shots?: Shot[];
}

/* Single source of truth for both sections, and for the build-time
 * link-preview scraper (scripts/fetch-link-previews.mjs reads the JSON
 * directly, so it stays plain JSON rather than a .ts module). */
export const works: Project[] = data.works;
/* Cast: TypeScript widens the JSON's `category` strings, which no longer
 * satisfy the ProjectCategory union. */
export const pastWorks = data.pastWorks as Project[];
export const personalProjects: Project[] = data.personalProjects;
