'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { chatPanel, popIn } from '../motion/variants';
import { useChat } from '../../lib/assistant/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SuggestionChips } from './SuggestionChips';

const SUGGESTED_QUESTIONS = [
	'What do you work on?',
	'What tools do you use?',
	'Tell me about your projects',
	'How can I contact you?',
];

export function AssistantWidget() {
	const [open, setOpen] = useState(false);
	const { messages, isStreaming, send, stop } = useChat();
	const shouldReduceMotion = useReducedMotion();
	const launcherRef = useRef<HTMLButtonElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!open) return;
		inputRef.current?.focus();
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open]);

	const close = () => {
		stop();
		setOpen(false);
		launcherRef.current?.focus();
	};

	const ask = (question: string) => {
		void send(question);
	};

	return (
		<>
			<AnimatePresence>
				{!open && (
					<motion.button
						key="launcher"
						ref={launcherRef}
						type="button"
						aria-label="Ask about Duljek"
						aria-expanded={open}
						onClick={() => setOpen(true)}
						className="fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-stone-950 text-bone-white shadow-lg shadow-stone-900/20 transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
						initial={shouldReduceMotion ? 'visible' : 'hidden'}
						animate="visible"
						exit="hidden"
						variants={popIn}
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M12 4c-4.9 0-9 3.1-9 7 0 2.2 1.2 4.1 3.1 5.4-.1 1-.5 2.1-1.4 3.1 1.8-.2 3.2-.9 4.1-1.6.9.2 2 .4 3.2.4 4.9 0 9-3.1 9-7s-4.1-7-9-7Z"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinejoin="round"
							/>
						</svg>
					</motion.button>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{open && (
					<motion.div
						key="panel"
						role="dialog"
						aria-label="Ask about Duljek"
						className="fixed inset-x-3 bottom-3 z-50 flex h-[min(560px,calc(100dvh-5rem))] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-bone-white shadow-xl shadow-stone-900/15 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]"
						initial={shouldReduceMotion ? 'visible' : 'hidden'}
						animate="visible"
						exit="hidden"
						variants={chatPanel}
					>
						<header className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
							<div className="flex flex-col">
								<span className="text-sm font-medium text-stone-950">Ask me anything</span>
								<span className="text-xs text-stone-500">AI assistant, answered from my profile</span>
							</div>
							<button
								type="button"
								aria-label="Close chat"
								onClick={close}
								className="flex size-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path
										d="M6 6l12 12M18 6L6 18"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
								</svg>
							</button>
						</header>

						<MessageList messages={messages} />

						{messages.length === 1 && (
							<SuggestionChips questions={SUGGESTED_QUESTIONS} onSelect={ask} />
						)}

						<ChatInput ref={inputRef} isStreaming={isStreaming} onSend={ask} />
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
