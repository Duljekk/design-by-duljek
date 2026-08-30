'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from './types';

const SESSION_KEY = 'assistant-session-id';
const HISTORY_SENT = 10;

const GREETING: ChatMessage = {
	role: 'assistant',
	content:
		'Hi! I can answer questions about Duljek — his work, tools, and projects. What would you like to know?',
};

function getSessionId(): string {
	let id = sessionStorage.getItem(SESSION_KEY);
	if (!id) {
		id = crypto.randomUUID();
		sessionStorage.setItem(SESSION_KEY, id);
	}
	return id;
}

export function useChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
	const [isStreaming, setIsStreaming] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	const stop = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
	}, []);

	useEffect(() => stop, [stop]);

	const send = useCallback(
		async (message: string) => {
			const trimmed = message.trim();
			if (!trimmed || isStreaming) return;

			const history = messages.slice(-HISTORY_SENT);
			setMessages((prev) => [...prev, { role: 'user', content: trimmed }, { role: 'assistant', content: '' }]);
			setIsStreaming(true);

			const controller = new AbortController();
			abortRef.current = controller;

			try {
				const response = await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						message: trimmed,
						history,
						sessionId: getSessionId(),
						page: window.location.pathname,
					}),
					signal: controller.signal,
				});

				if (!response.ok || !response.body) {
					const data = (await response.json().catch(() => null)) as { error?: string } | null;
					throw new Error(data?.error ?? 'Something went wrong. Try again.');
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const text = decoder.decode(value, { stream: true });
					setMessages((prev) => {
						const next = [...prev];
						const last = next[next.length - 1];
						if (last?.role === 'assistant') {
							next[next.length - 1] = { ...last, content: last.content + text };
						}
						return next;
					});
				}
			} catch (error) {
				// Aborts keep whatever streamed so far — only real errors surface.
				if ((error as Error).name !== 'AbortError') {
					setMessages((prev) => {
						const next = [...prev];
						const last = next[next.length - 1];
						if (last?.role === 'assistant') {
							next[next.length - 1] = { ...last, content: last.content || (error as Error).message };
						}
						return next;
					});
				}
			} finally {
				setIsStreaming(false);
				abortRef.current = null;
			}
		},
		[messages, isStreaming],
	);

	return { messages, isStreaming, send, stop };
}
