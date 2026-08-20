'use client';

import { motion, useReducedMotion } from 'motion/react';
import { fadeUp, staggerContainer } from '../motion/variants';
import { MorvaLabs } from '../ui/MorvaLabs';

export function Hero() {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.header
			className="flex flex-col gap-6 px-3"
			initial={shouldReduceMotion ? 'visible' : 'hidden'}
			animate="visible"
			variants={staggerContainer}
		>
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
					digital products, from shaping how they work and feel to actually building them. I
					care deeply about craft, interaction, and the small details that make a product feel
					right.
				</p>
				<p>
					I also enjoy working across the line between design and code, using Framer and modern
					web technologies to bring ideas to life.
				</p>
			</motion.div>
		</motion.header>
	);
}
