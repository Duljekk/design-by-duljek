'use client';

import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, Ref, SubmitEvent } from 'react';

interface Props {
	isStreaming: boolean;
	onSend: (message: string) => void;
}

const MAX_MESSAGE_LENGTH = 500;

export const ChatInput = forwardRef<HTMLInputElement, Props>(function ChatInput(
	{ isStreaming, onSend },
	ref: Ref<HTMLInputElement>,
) {
	const [value, setValue] = useState('');

	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = value.trim();
		if (!trimmed || isStreaming) return;
		onSend(trimmed);
		setValue('');
	};

	const inputProps: InputHTMLAttributes<HTMLInputElement> = {
		type: 'text',
		value,
		onChange: (e) => setValue(e.target.value),
		placeholder: 'Ask a question…',
		maxLength: MAX_MESSAGE_LENGTH,
		'aria-label': 'Your question',
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex items-center gap-2 border-t border-stone-200 px-3 py-3"
		>
			<input
				{...inputProps}
				ref={ref}
				disabled={isStreaming}
				className="min-w-0 flex-1 rounded-full bg-stone-100 px-3.5 py-2 text-sm text-stone-950 placeholder:text-stone-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:opacity-60"
			/>
			<button
				type="submit"
				aria-label="Send message"
				disabled={isStreaming || !value.trim()}
				className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-950 text-bone-white transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:opacity-40"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M4.5 12h14m0 0-5.5-5.5M18.5 12 13 17.5"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
		</form>
	);
});
