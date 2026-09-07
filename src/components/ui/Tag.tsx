interface Props {
	children: string;
}

/* Small pill for post tags. Presentational only. */
export function Tag({ children }: Props) {
	return (
		<span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-sm text-stone-500">
			{children}
		</span>
	);
}
