interface Props {
	title: string;
	date: string;
	href?: string;
	active: boolean;
	/* Rows with no link and no hover card have nothing to activate — they render
	 * as plain text instead of a focusable button that does nothing. */
	interactive?: boolean;
	/* When true, the row paints no background of its own — the highlight is
	 * owned by a single morphing rectangle that ProjectList slides between
	 * rows. Leaving the row's own bg off avoids doubling up the two. */
	sharedHighlight?: boolean;
}

/* Presentational row only — the hover overlay is owned by ProjectList, which
 * keeps a single shared card and passes `active` down so this row can reflect
 * it. `active` mirrors the hover highlight so the row stays "lit" while the
 * pointer is over the floating card rather than the row itself. */
export function ProjectItem({
	title,
	date,
	href,
	active,
	interactive = true,
	sharedHighlight = false,
}: Props) {
	const bg = sharedHighlight ? '' : `hover:bg-stone-100 ${active ? 'bg-stone-100' : ''}`;
	const className = `group flex w-full items-center text-left rounded-xl py-2.5 pl-3 pr-3.5 transition-colors duration-200 ${bg}`;

	const body = (
		<>
			<div className="flex min-w-0 flex-1 flex-col">
				<p className="text-base font-medium text-stone-900">{title}</p>
				<p className="text-base text-stone-500">{date}</p>
			</div>
			{/* Only rows that actually open somewhere get the open-in-new-tab arrow. */}
			{href && (
				<img
					src="/icons/square-arrow.svg"
					alt=""
					width={16}
					height={16}
					className={`size-4 shrink-0 transition duration-200 ${
						active
							? 'translate-x-0 opacity-100'
							: '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
					}`}
				/>
			)}
		</>
	);

	if (href) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer" className={className}>
				{body}
			</a>
		);
	}

	if (!interactive) {
		return <div className={className}>{body}</div>;
	}

	return (
		<button type="button" className={className}>
			{body}
		</button>
	);
}
