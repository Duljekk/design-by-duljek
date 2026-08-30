'use client';

import { motion, useReducedMotion } from 'motion/react';
import { SectionHeading } from '../ui/SectionHeading';
import { ProjectList } from './ProjectList';
import { fadeUp, staggerContainer, viewportOnce } from '../motion/variants';
import { personalProjects as projects } from '../../lib/projects';

export function PersonalProjects() {
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
				<SectionHeading title="Personal Projects">
					Ideas I&rsquo;ve chased on my own time.
				</SectionHeading>
			</motion.div>
			<ProjectList items={projects} />
		</motion.section>
	);
}
