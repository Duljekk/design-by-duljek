'use client';

import { motion, useReducedMotion } from 'motion/react';
import { SectionHeading } from '../ui/SectionHeading';
import { ProjectList } from './ProjectList';
import { fadeUp, staggerContainer, viewportOnce } from '../motion/variants';
import { works } from '../../lib/projects';

export function Works() {
	const reduceMotion = useReducedMotion();

	return (
		<motion.section
			className="flex flex-col gap-4.5"
			variants={staggerContainer}
			initial={reduceMotion ? 'visible' : 'hidden'}
			whileInView="visible"
			viewport={viewportOnce}
		>
			<motion.div className="px-3" variants={fadeUp}>
				<SectionHeading title="Recent Works">
					Things I&rsquo;ve designed and built at{' '}
					<span className="font-medium text-stone-800">Morva Labs</span>
				</SectionHeading>
			</motion.div>
			<ProjectList items={works} />
		</motion.section>
	);
}
