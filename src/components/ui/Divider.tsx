export function Divider() {
	// Reproduces Figma's "Divider Frame" (12px gutter) + 1px dashed line (stone/200, 4px dash / 6px gap).
	return (
		<div className="px-3">
			<div
				role="separator"
				className="h-px w-full bg-[repeating-linear-gradient(to_right,var(--color-stone-200)_0_4px,transparent_4px_10px)]"
			/>
		</div>
	);
}
