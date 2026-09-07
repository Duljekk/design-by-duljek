'use client';

import { motion, useReducedMotion } from 'motion/react';

/* Live-tuned chip geometry + colours — resolved from DialKit by the Tools
 * row and applied here. Numbers are genuinely dynamic, so inline styles. */
export interface ChipParams {
	width: number;
	height: number;
	radius: number;
	borderWidth: number;
	background?: string;
	border?: string;
	highlight: number;
	/* rgb triplet the highlight is mixed from — white (default) for dark
	 * chips' top-sheen, black for light chips' recessed inset shadow. */
	highlightRgb?: string;
	opacity?: number;
}

interface Props {
	name: string;
	icon: string;
	iconWidth: number;
	iconHeight: number;
	description: string;
	chip: ChipParams;
	/* True while this chip is the hovered one — sweeps the shine across it
	 * once (the same streak as the Morva Labs mark, fired on hover rather
	 * than looping). */
	hovered?: boolean;
}

/* ─────────────────────────────────────────────────────────
 * CHIP SHINE — one sweep per hover
 *
 *   rest   streak parked off the top-left corner (instant — un-hovering
 *          must not replay the sweep in reverse)
 *   hover  streak travels down past the bottom-right corner
 *          (cubic-bezier 0.19,1,0.22,1), clipped by the chip's radius
 *
 * Sized off the live chip geometry, so a DialKit resize keeps the streak
 * covering corner to corner. Rotation lives in `style` so Motion composes
 * it with the animated x/y — a Tailwind `-rotate-45` class would be
 * overwritten by the inline transform Motion writes.
 * ───────────────────────────────────────────────────────── */
const SHINE = {
	thickness: 5, // px wide streak
	blur: 2, // px softening, matching the Morva Labs mark
	length: 1, // × the chip's span, so the streak clears both corners
	travel: 0.4, // × the chip's span, either side of centre
	sweep: { duration: 0.6, ease: [0.19, 1, 0.22, 1] },
} as const;

/* White sheen on the dark chips; the light ones (Figma 126:12832) take a
 * soft dark streak instead — the same inversion their inset highlight uses. */
const SHINE_OPACITY = { sheen: 0.5, shadow: 0.09 } as const;

function ChipShine({ chip, hovered }: { chip: ChipParams; hovered: boolean }) {
	const span = chip.width + chip.height;
	const length = span * SHINE.length;
	const distance = span * SHINE.travel;
	const rgb = chip.highlightRgb ?? '255,255,255';
	const alpha = rgb === '0,0,0' ? SHINE_OPACITY.shadow : SHINE_OPACITY.sheen;

	return (
		<motion.span
			aria-hidden
			className="pointer-events-none absolute"
			style={{
				width: SHINE.thickness,
				height: length,
				left: (chip.width - SHINE.thickness) / 2,
				top: (chip.height - length) / 2,
				rotate: -45,
				filter: `blur(${SHINE.blur}px)`,
				backgroundColor: `rgba(${rgb},${alpha})`,
			}}
			initial={false}
			animate={{ x: hovered ? distance : -distance, y: hovered ? distance : -distance }}
			transition={hovered ? SHINE.sweep : { duration: 0 }}
		/>
	);
}

/* Chip (Figma 11:443): a rounded tile with a solid background, a tool-specific
 * border, the icon at its natural aspect ratio, and an inset bottom highlight.
 * Horizontal padding is 5px (not 6) so the 1px border-equivalent ring leaves a
 * 20px content box that fits the widest icon without shrinking it. */
export function ToolItem({
	name,
	icon,
	iconWidth,
	iconHeight,
	description,
	chip,
	hovered = false,
}: Props) {
	const reduceMotion = useReducedMotion();
	const label = description ? `${name} — ${description}` : name;

	// Border and highlight are both painted as inset box-shadows on the same
	// overlay layer (rather than a CSS `border`) so they share one clip path.
	// A separate `border` + `border-radius` + `overflow-hidden` combo leaves a
	// hairline sub-pixel gap at the rounded corners in some browsers — invisible
	// on dark chips, but visible as a "hole" on light ones (e.g. MCP) where the
	// border color sits close to both the fill and the page background.
	const ring = [
		chip.border ? `inset 0 0 0 ${chip.borderWidth}px ${chip.border}` : null,
		`inset 0 -2px 0 rgba(${chip.highlightRgb ?? '255,255,255'},${chip.highlight})`,
	]
		.filter(Boolean)
		.join(', ');

	if (chip.background) {
		return (
			<span
				className="relative flex items-center justify-center overflow-hidden rounded-lg"
				style={{
					width: chip.width,
					height: chip.height,
					borderRadius: chip.radius,
					backgroundColor: chip.background,
					// The ring is a box-shadow now, not a layout-affecting border, so
					// its width has to be folded into the padding by hand to keep the
					// same 20px content box (5px design padding + 1px border-equivalent).
					padding: `${5 + chip.borderWidth}px ${5 + chip.borderWidth}px ${6 + chip.borderWidth}px`,
				}}
			>
				<img
					src={`/icons/tools/${icon}`}
					alt={label}
					width={iconWidth}
					height={iconHeight}
					className="block shrink-0"
				/>
				{/* Chip shine sweep — temporarily disabled */}
				{/* {!reduceMotion && <ChipShine chip={chip} hovered={hovered} />} */}
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 rounded-[inherit]"
					style={{ boxShadow: ring }}
				/>
			</span>
		);
	}

	// Self-contained logo (e.g. Jitter): full-bleed image carrying its own
	// baked-in fill.
	return (
		<span
			className="relative block overflow-hidden rounded-lg"
			style={{
				width: chip.width,
				height: chip.height,
				borderRadius: chip.radius,
				opacity: chip.opacity ?? 1,
			}}
		>
			<img
				src={`/icons/tools/${icon}`}
				alt={label}
				width={iconWidth}
				height={iconHeight}
				className="block size-full"
			/>
			{/* Chip shine sweep — temporarily disabled */}
			{/* {!reduceMotion && <ChipShine chip={chip} hovered={hovered} />} */}
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 rounded-[inherit]"
				style={{ boxShadow: ring }}
			/>
		</span>
	);
}
