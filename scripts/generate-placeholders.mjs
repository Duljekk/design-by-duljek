/**
 * Build-time blur-up placeholders.
 *
 * Runs as part of `prebuild`, after the link-preview scraper so freshly
 * downloaded og:images are covered too. For every image a project card shows
 * (each shot, each og:image) it renders a tiny WebP and inlines it as a data
 * URI in src/lib/image-placeholders.json. BlurImage paints that under the real
 * image, blurred, so a card that opens before its image has arrived shows a
 * soft impression of it instead of an empty frame.
 *
 * Like the scraper, this must never fail the build: an image it cannot read is
 * skipped, and BlurImage falls back to the frame's own background for it.
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS = path.join(ROOT, 'src/lib/projects.json');
const PREVIEWS = path.join(ROOT, 'src/lib/link-previews.json');
const MANIFEST = path.join(ROOT, 'src/lib/image-placeholders.json');

/* Enough to carry an image's colour layout, small enough that the whole set
 * inlines into the bundle for a few KB. It is blurred on screen, so detail
 * beyond this would never be seen. */
const PLACEHOLDER_WIDTH = 32;
const PLACEHOLDER_QUALITY = 50;

async function readJson(file, fallback) {
	if (!existsSync(file)) return fallback;
	try {
		return JSON.parse(await readFile(file, 'utf8'));
	} catch {
		return fallback;
	}
}

function collectSources(projects, previews) {
	const shots = [
		...(projects.works ?? []),
		...(projects.pastWorks ?? []),
		...(projects.personalProjects ?? []),
	].flatMap((project) => (project.shots ?? []).map((shot) => shot.src));
	const ogImages = Object.values(previews).map((preview) => preview?.image);

	return [...new Set([...shots, ...ogImages].filter(Boolean))];
}

async function main() {
	const { default: sharp } = await import('sharp');
	const projects = await readJson(PROJECTS, {});
	const previews = await readJson(PREVIEWS, {});
	const sources = collectSources(projects, previews);

	console.log(`[placeholders] rendering ${sources.length} image(s)`);

	const manifest = {};
	for (const src of sources) {
		const file = path.join(ROOT, 'public', src.replace(/^\//, ''));
		if (!existsSync(file)) {
			console.warn(`  ! ${src}: not found in public/`);
			continue;
		}

		try {
			const data = await sharp(file)
				.resize({ width: PLACEHOLDER_WIDTH })
				.webp({ quality: PLACEHOLDER_QUALITY })
				.toBuffer();
			manifest[src] = `data:image/webp;base64,${data.toString('base64')}`;
		} catch (error) {
			console.warn(`  ! ${src}: ${error.message}`);
		}
	}

	await writeFile(MANIFEST, `${JSON.stringify(manifest, null, '\t')}\n`);
	console.log(`[placeholders] wrote ${Object.keys(manifest).length} entr(ies)`);
}

main().catch((error) => {
	// Never break the build over placeholders; the committed manifest still ships.
	console.warn(`[placeholders] skipped: ${error.message}`);
});
