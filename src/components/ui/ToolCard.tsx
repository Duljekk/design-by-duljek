'use client';

interface Props {
	name: string;
	description?: string;
}

/* Presentation only — the shared card's position and width warp are driven by
 * the Tools row, which owns the single instance every tool hands off. */
export function ToolCard({ name, description }: Props) {
	return (
		<div className="flex w-max max-w-56 flex-col gap-0.5 px-3.5 py-2.5">
			<p className="whitespace-nowrap text-sm font-medium text-stone-900">{name}</p>
			{description && <p className="text-sm text-stone-500">{description}</p>}
		</div>
	);
}
