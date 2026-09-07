'use client';

import { motion, useReducedMotion } from 'motion/react';
import { socialLinks } from '../../lib/social';
import { fadeUp, popIn, staggerContainer, viewportOnce } from '../motion/variants';
import { SocialIcon } from '../ui/SocialIcon';

/* Figma 39:47 — the DULJEK wordmark's designed box. Kept as numbers so the
 * aspect ratio below stays tied to the exported asset rather than a rounded
 * guess, and the mark scales down proportionally on narrow screens. */
const WORDMARK = { width: 447.862, height: 88.96 } as const;

export function Footer() {
	const reduceMotion = useReducedMotion();

	return (
		<motion.footer
			className="flex flex-col items-center gap-6 px-3"
			variants={staggerContainer}
			initial={reduceMotion ? 'visible' : 'hidden'}
			whileInView="visible"
			viewport={viewportOnce}
		>
			<motion.nav
				aria-label="Social links"
				className="flex w-full items-center justify-center gap-1"
				variants={staggerContainer}
			>
				{socialLinks.map((link) => (
					<motion.div key={link.name} variants={popIn}>
						<SocialIcon
							name={link.name}
							href={link.href}
							icon={link.icon}
							iconWidth={link.iconWidth}
							iconHeight={link.iconHeight}
						/>
					</motion.div>
				))}
			</motion.nav>

			<motion.div className="flex w-full justify-center" variants={fadeUp}>
				<img
					src="/brand/duljek.svg"
					alt="Duljek"
					width={WORDMARK.width}
					height={WORDMARK.height}
					loading="lazy"
					decoding="async"
					className="block h-auto w-full"
					style={{
						maxWidth: WORDMARK.width,
						aspectRatio: `${WORDMARK.width} / ${WORDMARK.height}`,
					}}
				/>
			</motion.div>
		</motion.footer>
	);
}
