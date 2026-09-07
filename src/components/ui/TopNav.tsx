interface Props {
	/* Where the back link points, and what it reads as. Defaults to home. */
	href?: string;
	label?: string;
}

/* Static server-rendered back link for blog pages — the site otherwise has no
 * chrome, so this is the only navigation affordance. Kept as a plain component
 * (no client directive) since it's purely a link. */
export function TopNav({ href = '/', label = 'Design by Duljek' }: Props) {
	return (
		<nav className="px-3">
			<a
				href={href}
				className="group inline-flex items-center gap-1.5 text-base text-stone-500 transition-colors hover:text-stone-900"
			>
				<svg
					width={16}
					height={16}
					viewBox="0 0 16 16"
					fill="none"
					aria-hidden="true"
					className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
				>
					<path
						d="M10 12L6 8l4-4"
						stroke="currentColor"
						strokeWidth={1.5}
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				{label}
			</a>
		</nav>
	);
}
