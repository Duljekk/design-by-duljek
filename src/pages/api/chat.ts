import type { APIRoute } from 'astro';
import { buildSystemPrompt } from '../../lib/assistant/prompt';
import { classifyScope, REFUSAL_MESSAGE } from '../../lib/assistant/guardrail';
import type { ChatMessage, ChatRequestBody } from '../../lib/assistant/types';

export const prerender = false;

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 2000;

interface GeminiSSEChunk {
	candidates?: Array<{
		content?: { parts?: Array<{ text?: string }> };
	}>;
}

function json(data: unknown, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function sanitizeHistory(history: unknown): ChatMessage[] {
	if (!Array.isArray(history)) return [];
	return history
		.filter(
			(m): m is ChatMessage =>
				!!m &&
				typeof m === 'object' &&
				((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
				typeof (m as ChatMessage).content === 'string',
		)
		.map((m) => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_MESSAGE_LENGTH) }))
		.slice(-MAX_HISTORY);
}

function toGeminiContents(message: string, history: ChatMessage[]) {
	const contents = history.map((m) => ({
		role: m.role === 'assistant' ? 'model' : 'user',
		parts: [{ text: m.content }],
	}));
	contents.push({ role: 'user', parts: [{ text: message }] });
	return contents;
}

function extractTextStream(): TransformStream<Uint8Array, Uint8Array> {
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	let buffer = '';

	return new TransformStream<Uint8Array, Uint8Array>({
		transform(chunk, controller) {
			buffer += decoder.decode(chunk, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				if (!line.startsWith('data: ')) continue;
				const payload = line.slice(6).trim();
				if (!payload || payload === '[DONE]') continue;

				try {
					const parsed = JSON.parse(payload) as GeminiSSEChunk;
					const text = parsed.candidates?.[0]?.content?.parts
						?.map((part) => part.text ?? '')
						.join('');
					if (text) controller.enqueue(encoder.encode(text));
				} catch {
					// Ignore malformed SSE lines — the stream may end mid-chunk.
				}
			}
		},
	});
}

function captureQuestion(body: ChatRequestBody, inScope: boolean | null, refusal: boolean) {
	const apiKey = import.meta.env.POSTHOG_API_KEY;
	if (!apiKey) return;

	const host = import.meta.env.POSTHOG_HOST ?? 'https://us.i.posthog.com';
	void fetch(`${host}/capture/`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			api_key: apiKey,
			event: 'assistant_question',
			distinct_id: body.sessionId ?? 'anonymous',
			properties: {
				question: body.message,
				page: body.page ?? '/',
				model: GEMINI_MODEL,
				inScope,
				refusal,
			},
			timestamp: new Date().toISOString(),
		}),
	}).catch(() => {
		// Analytics must never break the chat — swallow capture failures.
	});
}

export const POST: APIRoute = async ({ request }) => {
	const apiKey = import.meta.env.GEMINI_API_KEY;
	if (!apiKey) {
		return json({ error: 'Assistant is not configured yet. Try again later.' }, 503);
	}

	let body: ChatRequestBody;
	try {
		body = (await request.json()) as ChatRequestBody;
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const message = typeof body.message === 'string' ? body.message.trim() : '';
	if (!message || message.length > MAX_MESSAGE_LENGTH) {
		return json({ error: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.` }, 400);
	}

	const history = sanitizeHistory(body.history);
	const inScope = await classifyScope(message, apiKey);
	const refusal = inScope === false;
	captureQuestion({ ...body, message }, inScope, refusal);

	if (refusal) {
		return new Response(REFUSAL_MESSAGE, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-store',
			},
		});
	}

	const upstream = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': apiKey,
			},
			body: JSON.stringify({
				systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
				contents: toGeminiContents(message, history),
			}),
		},
	);

	if (!upstream.ok || !upstream.body) {
		return json({ error: 'The assistant is unavailable right now. Try again shortly.' }, 502);
	}

	return new Response(upstream.body.pipeThrough(extractTextStream()), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store',
		},
	});
};
