import type { Tool } from '../../lib/tools';

export function ToolItem({ name, icon, description, background }: Tool) {
	/* Icons carry no link, so the description rides along in alt text rather
	 * than adding a tab stop per tool just to reach the hover card. */
	const label = description ? `${name} — ${description}` : name;

	if (background) {
		return (
			<span
				className={`flex size-8 items-center justify-center rounded-lg border border-bone-white p-1.5 ${background}`}
			>
				<img
					src={`/icons/tools/${icon}`}
					alt={label}
					width={20}
					height={20}
					className="size-5 object-contain"
				/>
			</span>
		);
	}

	return (
		<img
			src={`/icons/tools/${icon}`}
			alt={label}
			width={32}
			height={32}
			className="size-8 rounded-lg"
		/>
	);
}
