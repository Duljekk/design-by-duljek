import data from './image-placeholders.json';

const placeholders = data as Record<string, string | undefined>;

/* The inlined blur-up stand-in for a shipped image, keyed by its public path.
 * Generated at build time by scripts/generate-placeholders.mjs; undefined for
 * any image added since it last ran. */
export const placeholderFor = (src: string): string | undefined => placeholders[src];
