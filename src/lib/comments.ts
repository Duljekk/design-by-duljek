/* Comment data layer.
 *
 * There is no database wired up yet, so comments persist to the visitor's own
 * browser (localStorage). Everything is async and isolated to this module so the
 * swap to a real backend is a one-file change: reimplement `loadComments` and
 * `addComment` to hit `/api/comments` and the UI stays untouched. */

export interface Comment {
	id: string;
	author: string;
	body: string;
	createdAt: number;
}

const STORAGE_PREFIX = 'dbd:comments:';

function keyFor(slug: string): string {
	return `${STORAGE_PREFIX}${slug}`;
}

export async function loadComments(slug: string): Promise<Comment[]> {
	try {
		const raw = localStorage.getItem(keyFor(slug));
		if (!raw) return [];
		const parsed = JSON.parse(raw) as Comment[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export async function addComment(
	slug: string,
	input: { author: string; body: string },
): Promise<Comment> {
	const comment: Comment = {
		id:
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
		author: input.author.trim() || 'Anonymous',
		body: input.body.trim(),
		createdAt: Date.now(),
	};

	const existing = await loadComments(slug);
	const next = [comment, ...existing];
	try {
		localStorage.setItem(keyFor(slug), JSON.stringify(next));
	} catch {
		/* Storage full or blocked (private mode) — the comment still shows for
		 * this session; it just won't persist across reloads. */
	}
	return comment;
}

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
	{ amount: 60, unit: 'second' },
	{ amount: 60, unit: 'minute' },
	{ amount: 24, unit: 'hour' },
	{ amount: 7, unit: 'day' },
	{ amount: 4.34524, unit: 'week' },
	{ amount: 12, unit: 'month' },
	{ amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export function relativeTime(timestamp: number): string {
	let duration = (timestamp - Date.now()) / 1000;
	for (const division of DIVISIONS) {
		if (Math.abs(duration) < division.amount) {
			return relativeFormatter.format(Math.round(duration), division.unit);
		}
		duration /= division.amount;
	}
	return relativeFormatter.format(Math.round(duration), 'year');
}
