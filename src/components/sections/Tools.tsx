'use client';

import { motion, useReducedMotion } from 'motion/react';
import { SectionHeading } from '../ui/SectionHeading';
import { ToolItem } from '../ui/ToolItem';
import { tools } from '../../lib/tools';
import { fadeUp, popIn, staggerContainer, viewportOnce } from '../motion/variants';

export function Tools() {
	const reduceMotion = useReducedMotion();

	return (
		<motion.section
			className="flex flex-col gap-3.5 px-3"
			variants={staggerContainer}
			initial={reduceMotion ? 'visible' : 'hidden'}
			whileInView="visible"
			viewport={viewportOnce}
		>
			<motion.div variants={fadeUp}>
				<SectionHeading title="Tools">What I use to design, build, and experiment.</SectionHeading>
			</motion.div>
			<motion.div className="flex [&>*+*]:-ml-2" variants={staggerContainer}>
				{tools.map((tool, index) => (
					<motion.div key={`${tool.name}-${index}`} variants={popIn}>
						<ToolItem {...tool} />
					</motion.div>
				))}
			</motion.div>
		</motion.section>
	);
}
