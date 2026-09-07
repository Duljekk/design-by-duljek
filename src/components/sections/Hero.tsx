'use client';

import { motion, useReducedMotion } from 'motion/react';
import { fadeUp, staggerContainer } from '../motion/variants';
import { MorvaLabs } from '../ui/MorvaLabs';

/* ─────────────────────────────────────────────────────────
 * PHOTO — HOVER STORYBOARD
 *
 *   rest    photo desaturated (grayscale, muted)
 *  hover    fades up to full color, ~250ms ease
 * ───────────────────────────────────────────────────────── */
const PHOTO = {
	restFilter: 'grayscale(1) saturate(0)', // desaturated at rest
	hoverFilter: 'grayscale(0) saturate(1)', // full color on hover
	transition: { duration: 0.25, ease: 'easeOut' } as const,
	src: '/hero/duljek_photos_1x.webp',
	srcSet:
		'/hero/duljek_photos_1x.webp 1x, /hero/duljek_photos_2x.webp 2x, /hero/duljek_photos_3x.webp 3x, /hero/duljek_photos_4x.webp 4x',
};

export function Hero() {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.header
			className="flex flex-col gap-6 px-3"
			initial={shouldReduceMotion ? 'visible' : 'hidden'}
			animate="visible"
			variants={staggerContainer}
		>
			<motion.div
				className="-mb-3 flex w-fit items-center rounded-lg border border-black/10 bg-white p-1.5 shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.08),0px_1.5px_3px_-1.5px_rgba(0,0,0,0.12)]"
				variants={fadeUp}
			>
				<motion.img
					src={PHOTO.src}
					srcSet={PHOTO.srcSet}
					alt="Abdul Zaki Syahrul Rahmat"
					width={70}
					height={80}
					decoding="async"
					className="h-20 w-[70px] rounded bg-[#f9f9f9] object-cover"
					initial={false}
					animate={{ filter: PHOTO.restFilter }}
					whileHover={{ filter: PHOTO.hoverFilter }}
					transition={shouldReduceMotion ? { duration: 0 } : PHOTO.transition}
				/>
			</motion.div>

			<motion.div className="flex flex-col" variants={fadeUp}>
				<h1 className="text-base font-medium text-stone-950">Abdul Zaki Syahrul Rahmat</h1>
				<p className="flex flex-wrap items-center gap-2 text-base">
					<span className="text-stone-600">Framer Developer at</span>
					<MorvaLabs />
				</p>
			</motion.div>

			<motion.div className="flex flex-col gap-3.5 text-base text-stone-500" variants={fadeUp}>
				<p>
					I&rsquo;m a <span className="text-stone-700">Product Designer</span> and{' '}
					<span className="text-stone-700">Framer Developer</span>. I like turning ideas into
					digital products, from shaping how they work and feel to actually building them. I care
					deeply about craft, interaction, and the small details that make a product feel right.
				</p>
				<p>
					I also enjoy working across the line between design and code, using Framer and modern web
					technologies to bring ideas to life.
				</p>
			</motion.div>
		</motion.header>
	);
}
