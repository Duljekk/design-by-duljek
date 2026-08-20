import type { Tool } from '../../lib/tools';

export function ToolItem({ name, icon, background }: Tool) {
	const badge = background ? (
		<span
			className={`flex size-8 items-center justify-center rounded-lg border border-bone-white p-1.5 ${background}`}
		>
			<img
				src={`/icons/tools/${icon}`}
				alt={name}
				width={20}
				height={20}
				className="size-5 object-contain"
			/>
		</span>
	) : (
		<img
			src={`/icons/tools/${icon}`}
			alt={name}
			width={32}
			height={32}
			className="size-8 rounded-lg"
		/>
	);

	return badge;
}
