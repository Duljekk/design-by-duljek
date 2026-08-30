export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface ChatRequestBody {
	message: string;
	/** Earlier turns of the conversation, most recent last. */
	history?: ChatMessage[];
	/** Client-generated UUID used as the PostHog distinct id. */
	sessionId?: string;
	/** Path of the page the widget was opened on. */
	page?: string;
}
