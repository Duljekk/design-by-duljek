'use client';

import { motion, useReducedMotion } from 'motion/react';
import { SectionHeading } from '../ui/SectionHeading';
import { ProjectItem } from '../ui/ProjectItem';
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
				<SectionHeading title="Works">
					Things I&rsquo;ve designed and built at{' '}
					<span className="font-medium text-stone-800">Morva Labs</span>
				</SectionHeading>
			</motion.div>
			<motion.div className="flex flex-col" variants={staggerContainer}>
				{works.map((work) => (
					<motion.div key={work.title} variants={fadeUp}>
						<ProjectItem title={work.title} date={work.date} href={work.href} />
					</motion.div>
				))}
			</motion.div>
		</motion.section>
	);
}
