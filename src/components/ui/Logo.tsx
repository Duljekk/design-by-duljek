interface Props {
	size?: number;
	alt?: string;
	className?: string;
}

export function Logo({ size = 16, alt = 'Morva', className = '' }: Props) {
	return (
		<img
			src="/logo-morva.svg"
			alt={alt}
			width={size}
			height={size}
			className={`rounded-full ${className}`.trim()}
		/>
	);
}
