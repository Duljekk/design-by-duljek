/**
 * Build-time link-preview scraper.
 *
 * Runs as `prebuild`, so `npm run build` (and Vercel) always has fresh data.
 * For every project href it collects OG/meta title, description and favicon,
 * downloads the images into public/previews/, and writes a manifest that the
 * client bundle imports. Doing this at build time keeps the site fully static
 * and means hovering a row costs zero network requests.
 *
 * This must never fail the build: any URL that errors falls back to whatever
 * the committed manifest already had, so a flaky third-party site or an
 * offline build still ships.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS = path.join(ROOT, 'src/lib/projects.json');
const MANIFEST = path.join(ROOT, 'src/lib/link-previews.json');
const IMAGE_DIR = path.join(ROOT, 'public/previews');
const PUBLIC_PREFIX = '/previews';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const OG_IMAGE_WIDTH = 1200; // the OG standard 1200x630; aspect ratio is preserved
const USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const EXT_BY_TYPE = {
	'image/png': '.png',
	'image/jpeg': '.jpg',
	'image/jpg': '.jpg',
	'image/gif': '.gif',
	'image/webp': '.webp',
	'image/avif': '.avif',
	'image/svg+xml': '.svg',
	'image/x-icon': '.ico',
	'image/vnd.microsoft.icon': '.ico',
};

function decodeEntities(value) {
	return value
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function parseAttrs(tag) {
	const attrs = {};
	const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
	let match;
	while ((match = re.exec(tag))) {
		attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
	}
	return attrs;
}

function collectTags(html, tagName) {
	const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
	return (html.match(re) ?? []).map(parseAttrs);
}

function firstNonEmpty(...values) {
	for (const value of values) {
		const trimmed = value?.trim();
		if (trimmed) return trimmed;
	}
	return undefined;
}

/** Prefer a light-scheme icon — the site renders on a bone-white background. */
function pickFavicon(links, pageUrl) {
	const icons = links.filter((link) => /\bicon\b/i.test(link.rel ?? '') && link.href);
	const score = (link) => {
		const media = link.media ?? '';
		if (/dark/i.test(media)) return 3;
		if (/\bapple-touch-icon\b/i.test(link.rel ?? '')) return 2;
		return /light/i.test(media) ? 0 : 1;
	};
	const best = icons.sort((a, b) => score(a) - score(b))[0];
	return best ? absolute(best.href, pageUrl) : absolute('/favicon.ico', pageUrl);
}

function absolute(href, base) {
	// An empty href would resolve to the page itself — treat it as "no URL".
	if (!href?.trim()) return undefined;
	try {
		return new URL(href, base).toString();
	} catch {
		return undefined;
	}
}

async function fetchWithTimeout(url, accept) {
	return fetch(url, {
		redirect: 'follow',
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		headers: { 'user-agent': USER_AGENT, accept },
	});
}

/* OG images are routinely 1200-2400px wide — far more than the 320px card
 * needs. Downscale to WebP so the first hover pulls ~25KB instead of ~280KB.
 * sharp comes in with Astro's image tooling; if it ever goes missing we just
 * keep the original bytes rather than failing the build. */
async function encodeImage(buffer, kind, type, url) {
	const original = { data: buffer, ext: extensionFor(type, url) };
	const isVector = type === 'image/svg+xml';
	const isAnimated = type === 'image/gif';
	if (kind !== 'og' || isVector || isAnimated) return original;

	try {
		const { default: sharp } = await import('sharp');
		const data = await sharp(buffer)
			.resize({ width: OG_IMAGE_WIDTH, withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer();
		return data.byteLength < buffer.byteLength ? { data, ext: '.webp' } : original;
	} catch (error) {
		warn(url, `optimisation skipped — ${error.message}`);
		return original;
	}
}

function extensionFor(type, url) {
	if (EXT_BY_TYPE[type]) return EXT_BY_TYPE[type];

	const fromPath = path.extname(new URL(url).pathname).toLowerCase();
	if (/^\.[a-z0-9]{2,5}$/.test(fromPath)) return fromPath;

	const subtype = type.slice('image/'.length).replace(/[^a-z0-9]/g, '');
	return subtype ? `.${subtype}` : '.png';
}

async function downloadImage(url, kind) {
	if (!url) return undefined;

	const res = await fetchWithTimeout(url, 'image/*,*/*;q=0.8');
	if (!res.ok) throw new Error(`${kind} image responded ${res.status}`);

	const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
	// Sites without an image often serve an HTML page here — never save that as one.
	if (!type.startsWith('image/')) throw new Error(`${kind} image was ${type || 'untyped'}, not an image`);

	const buffer = Buffer.from(await res.arrayBuffer());
	if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error(`${kind} image too large`);
	if (buffer.byteLength === 0) throw new Error(`${kind} image empty`);

	const { data, ext } = await encodeImage(buffer, kind, type, url);
	const name = `${kind}-${createHash('sha256').update(url).digest('hex').slice(0, 12)}${ext}`;

	await mkdir(IMAGE_DIR, { recursive: true });
	await writeFile(path.join(IMAGE_DIR, name), data);

	return `${PUBLIC_PREFIX}/${name}`;
}

async function scrape(href) {
	const res = await fetchWithTimeout(href, 'text/html,application/xhtml+xml');
	if (!res.ok) throw new Error(`page responded ${res.status}`);

	const html = await res.text();
	const pageUrl = res.url || href;

	const meta = {};
	for (const tag of collectTags(html, 'meta')) {
		const key = (tag.property ?? tag.name)?.toLowerCase();
		if (key && tag.content) meta[key] = tag.content;
	}

	const docTitle = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();

	const title = firstNonEmpty(meta['og:title'], meta['twitter:title'], docTitle, new URL(pageUrl).hostname);
	const description = firstNonEmpty(meta['og:description'], meta['twitter:description'], meta.description);
	const imageUrl = absolute(firstNonEmpty(meta['og:image'], meta['twitter:image']), pageUrl);
	const faviconUrl = pickFavicon(collectTags(html, 'link'), pageUrl);

	// A missing/failed image degrades to a text-only card rather than failing the entry.
	const [image, favicon] = await Promise.all([
		downloadImage(imageUrl, 'og').catch((error) => {
			warn(href, `og:image skipped — ${error.message}`);
			return undefined;
		}),
		downloadImage(faviconUrl, 'icon').catch((error) => {
			warn(href, `favicon skipped — ${error.message}`);
			return undefined;
		}),
	]);

	return {
		url: href,
		domain: new URL(pageUrl).hostname.replace(/^www\./, ''),
		title,
		description,
		image,
		favicon,
		fetchedAt: new Date().toISOString(),
	};
}

function warn(href, message) {
	console.warn(`  ! ${href}: ${message}`);
}

async function readJson(file, fallback) {
	if (!existsSync(file)) return fallback;
	try {
		return JSON.parse(await readFile(file, 'utf8'));
	} catch {
		return fallback;
	}
}

async function main() {
	const projects = await readJson(PROJECTS, { works: [], personalProjects: [] });
	const previous = await readJson(MANIFEST, {});

	const hrefs = [...(projects.works ?? []), ...(projects.personalProjects ?? [])]
		.map((project) => project.href)
		.filter(Boolean);

	console.log(`[link-previews] fetching ${hrefs.length} link(s)`);

	const manifest = {};
	for (const href of hrefs) {
		try {
			manifest[href] = await scrape(href);
			console.log(`  ✓ ${href}`);
		} catch (error) {
			if (previous[href]) {
				manifest[href] = previous[href];
				warn(href, `${error.message} — reusing cached preview`);
			} else {
				warn(href, `${error.message} — no preview available`);
			}
		}
	}

	await writeFile(MANIFEST, `${JSON.stringify(manifest, null, '\t')}\n`);
	console.log(`[link-previews] wrote ${Object.keys(manifest).length} entr(ies)`);
}

main().catch((error) => {
	// Never break the build over link previews.
	console.warn(`[link-previews] skipped: ${error.message}`);
});
