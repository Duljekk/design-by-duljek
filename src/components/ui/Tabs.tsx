'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { KeyboardEvent } from 'react';
import { useRef } from 'react';

/* ─────────────────────────────────────────────────────────
 * TAB PILL STORYBOARD
 *
 * There is exactly ONE white pill on the strip. It is shared across every tab
 * through `layoutId`, so switching never mounts a second one — the same element
 * travels to the new tab and warps its width to fit the new label.
 *
 *   0ms   press — pill leaves the old tab (spring, tiny bounce)
 *   0ms   old label softens stone-900 → stone-500, new label darkens
 *         (a 180ms colour crossfade, so the labels resolve just behind the pill)
 * 300ms   pill settled and sized to the new label
 *
 * Nothing here animates a layout property: the pill travels on transform and
 * Motion scale-corrects the radius, so a switch costs one composited move.
 *
 * PAINT ORDER: the pill lives inside whichever tab is selected, so plain DOM
 * order would let it cross *over* the label it is travelling away from on one
 * direction and *under* it on the other. The strip is therefore an isolated
 * stacking context and the pill sits at a negative layer inside it — above the
 * stone track it slides along, always beneath every label. Nothing here may
 * take a transform for the same reason: a transform on a tab button would open
 * a stacking context that traps the pill and brings the asymmetry back.
 * ───────────────────────────────────────────────────────── */

const PILL = {
	/* px. Owned by `style`, not a `rounded-md` class: the width warp is applied
	 * as scaleX, and a class-set radius squashes with the box — the corners
	 * visibly flatten mid-travel, then snap round at the end. */
	radius: 6,
	/* A small bounce is the whole character of a segmented control — the pill
	 * arrives, settles, and reads as a physical object rather than a fade. Kept
	 * low so the edge never overshoots far enough to clip the label it left. */
	travel: { type: 'spring', visualDuration: 0.3, bounce: 0.16 },
} as const;

const LABEL = {
	/* Runs a touch faster than the pill so the incoming label is already dark by
	 * the time the pill covers it, instead of visibly catching up underneath. */
	fade: 'duration-180 ease-out',
} as const;

export interface TabItem {
	id: string;
	label: string;
}

interface Props {
	/* Unique on the page — namespaces the shared pill so two strips can never
	 * animate into one another. */
	id: string;
	items: readonly TabItem[];
	value: string;
	onChange: (id: string) => void;
	/* id of the region this strip controls, for `aria-controls`. */
	panelId?: string;
	className?: string;
}

export function Tabs({ id, items, value, onChange, panelId, className }: Props) {
	const reduceMotion = useReducedMotion();
	const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

	/* Roving focus: the strip is one tab stop, arrows move between tabs and
	 * select as they go — the pattern a segmented control is expected to follow. */
	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const current = items.findIndex((item) => item.id === value);
		if (current === -1) return;

		const next = {
			ArrowLeft: (current - 1 + items.length) % items.length,
			ArrowRight: (current + 1) % items.length,
			Home: 0,
			End: items.length - 1,
		}[event.key];

		if (next === undefined) return;
		event.preventDefault();
		onChange(items[next].id);
		tabRefs.current[next]?.focus();
	};

	return (
		<div
			role="tablist"
			aria-label="Filter past works by category"
			/* `isolate`: the pill is layered against this strip, not the page. */
			className={`isolate flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5 ${className ?? ''}`}
			onKeyDown={handleKeyDown}
		>
			{items.map((item, index) => {
				const selected = item.id === value;

				return (
					<button
						key={item.id}
						ref={(element) => {
							tabRefs.current[index] = element;
						}}
						type="button"
						role="tab"
						id={`${id}-tab-${item.id}`}
						aria-selected={selected}
						aria-controls={panelId}
						tabIndex={selected ? 0 : -1}
						onClick={() => onChange(item.id)}
						className="relative flex shrink-0 cursor-pointer items-center justify-center rounded-md px-2.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
					>
						{selected && (
							<motion.span
								aria-hidden="true"
								layoutId={`${id}-pill`}
								className="absolute inset-0 -z-10 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05),inset_0_-1px_0_0_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(39,39,42,0.15)]"
								style={{ borderRadius: PILL.radius }}
								transition={reduceMotion ? { duration: 0 } : PILL.travel}
							/>
						)}
						<span
							className={`px-0.5 text-sm leading-5 font-medium transition-colors ${LABEL.fade} ${
								selected ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700'
							}`}
						>
							{item.label}
						</span>
					</button>
				);
			})}
		</div>
	);
}
