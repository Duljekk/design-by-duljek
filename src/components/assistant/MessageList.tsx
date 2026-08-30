'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../lib/assistant/types';

interface Props {
	messages: ChatMessage[];
}

/* Only stick to the bottom while the user is already there, so reading
 * back through history isn't fighting auto-scroll during streaming. */
const BOTTOM_THRESHOLD = 40;

export function MessageList({ messages }: Props) {
	const listRef = useRef<HTMLDivElement>(null);
	const atBottomRef = useRef(true);

	const handleScroll = () => {
		const el = listRef.current;
		if (!el) return;
		atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
	};

	useEffect(() => {
		const el = listRef.current;
		if (el && atBottomRef.current) {
			el.scrollTop = el.scrollHeight;
		}
	}, [messages]);

	return (
		<div
			ref={listRef}
			onScroll={handleScroll}
			className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
		>
			{messages.map((message, index) => {
				const isLast = index === messages.length - 1;
				const awaitingReply = isLast && message.role === 'assistant' && !message.content;

				return (
					<div
						key={index}
						className={
							message.role === 'user'
								? 'max-w-[85%] self-end rounded-2xl rounded-br-md bg-stone-950 px-3.5 py-2 text-sm text-bone-white'
								: 'max-w-[85%] self-start rounded-2xl rounded-bl-md bg-stone-100 px-3.5 py-2 text-sm text-stone-900'
						}
						{...(isLast ? { 'aria-live': 'polite' as const } : {})}
					>
						{awaitingReply ? (
							<span className="inline-flex gap-1 py-1" aria-label="Assistant is typing">
								<span className="size-1.5 animate-pulse rounded-full bg-stone-500" />
								<span className="size-1.5 animate-pulse rounded-full bg-stone-500 [animation-delay:150ms]" />
								<span className="size-1.5 animate-pulse rounded-full bg-stone-500 [animation-delay:300ms]" />
							</span>
						) : (
							message.content
						)}
					</div>
				);
			})}
		</div>
	);
}
