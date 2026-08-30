import data from './projects.json';

export interface Shot {
	src: string;
	srcSet?: string;
	width: number;
	height: number;
	alt: string;
	href?: string;
}

export interface Project {
	title: string;
	date: string;
	href?: string;
	shots?: Shot[];
}

/* Single source of truth for both sections, and for the build-time
 * link-preview scraper (scripts/fetch-link-previews.mjs reads the JSON
 * directly, so it stays plain JSON rather than a .ts module). */
export const works: Project[] = data.works;
export const personalProjects: Project[] = data.personalProjects;
