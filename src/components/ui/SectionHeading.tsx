import type { ReactNode } from 'react';

interface Props {
	title: string;
	children?: ReactNode;
}

export function SectionHeading({ title, children }: Props) {
	return (
		<div className="flex flex-col">
			<h2 className="text-base font-medium text-stone-900">{title}</h2>
			{children ? <p className="text-base text-stone-600">{children}</p> : null}
		</div>
	);
}
