interface Props {
	title: string;
	date: string;
	href?: string;
}

export function ProjectItem({ title, date, href }: Props) {
	const className =
		'group flex items-center rounded-xl py-2.5 pl-3 pr-3.5 transition-colors duration-200 hover:bg-stone-100';

	const body = (
		<>
			<div className="flex min-w-0 flex-1 flex-col">
				<p className="text-base font-medium text-stone-900">{title}</p>
				<p className="text-base text-stone-500">{date}</p>
			</div>
			<img
				src="/icons/square-arrow.svg"
				alt=""
				width={16}
				height={16}
				className="size-4 shrink-0 -translate-x-1 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
			/>
		</>
	);

	if (href) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer" className={className}>
				{body}
			</a>
		);
	}

	return <div className={className}>{body}</div>;
}
