'use client';

import { motion, useReducedMotion } from 'motion/react';
import { SectionHeading } from '../ui/SectionHeading';
import { ProjectItem } from '../ui/ProjectItem';
import { fadeUp, staggerContainer, viewportOnce } from '../motion/variants';

const projects = [
	{ title: 'Nca Turns 24th', date: 'March 2026 - Now', href: 'https://ncaturns24.framer.website/' },
];

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
					Things I&rsquo;ve designed and built at Morva Labs
				</SectionHeading>
			</motion.div>
			<motion.div className="flex flex-col" variants={staggerContainer}>
				{projects.map((project) => (
					<motion.div key={project.title} variants={fadeUp}>
						<ProjectItem title={project.title} date={project.date} href={project.href} />
					</motion.div>
				))}
			</motion.div>
		</motion.section>
	);
}
