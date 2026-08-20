import type { ReactNode } from 'react';

interface Props {
	children: ReactNode;
	className?: string;
}

export function Container({ children, className = '' }: Props) {
	return <div className={`mx-auto w-full max-w-page px-3 ${className}`.trim()}>{children}</div>;
}
