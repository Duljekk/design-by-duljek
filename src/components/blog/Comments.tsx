'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { SubmitEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { addComment, type Comment, loadComments, relativeTime } from '../../lib/comments';

interface Props {
	slug: string;
}

const MAX_LENGTH = 800;

/* Anonymous comment section. Name is optional and defaults to "Anonymous".
 * Data goes through lib/comments (currently device-local; see that file). */
export function Comments({ slug }: Props) {
	const reduceMotion = useReducedMotion();
	const [comments, setComments] = useState<Comment[]>([]);
	const [ready, setReady] = useState(false);
	const [author, setAuthor] = useState('');
	const [body, setBody] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		let active = true;
		loadComments(slug).then((loaded) => {
			if (active) {
				setComments(loaded);
				setReady(true);
			}
		});
		return () => {
			active = false;
		};
	}, [slug]);

	const trimmed = body.trim();
	const canSubmit = trimmed.length > 0 && !submitting;

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSubmit) return;
		setSubmitting(true);
		const created = await addComment(slug, { author, body });
		setComments((prev) => [created, ...prev]);
		setBody('');
		setAuthor('');
		setSubmitting(false);
		textareaRef.current?.focus();
	};

	const count = comments.length;

	return (
		<section className="flex flex-col gap-5 px-3" aria-label="Comments">
			<div className="flex flex-col">
				<h2 className="text-base font-medium text-stone-900">
					Comments{ready && count > 0 ? ` (${count})` : ''}
				</h2>
				<p className="text-base text-stone-600">
					Share a thought — no account needed. Leave the name blank to post anonymously.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
				<input
					type="text"
					value={author}
					onChange={(event) => setAuthor(event.target.value)}
					placeholder="Name (optional)"
					maxLength={60}
					className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-base text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
				/>
				<div className="flex flex-col gap-1.5">
					<textarea
						ref={textareaRef}
						value={body}
						onChange={(event) => setBody(event.target.value.slice(0, MAX_LENGTH))}
						placeholder="Write a comment…"
						rows={3}
						className="w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-2 text-base leading-6 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
					/>
					<div className="flex items-center justify-between">
						<span className="text-sm text-stone-400">
							{trimmed.length}/{MAX_LENGTH}
						</span>
						<button
							type="submit"
							disabled={!canSubmit}
							className="rounded-lg bg-stone-900 px-4 py-2 text-base font-medium text-bone-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
						>
							Post comment
						</button>
					</div>
				</div>
			</form>

			<div className="flex flex-col">
				{ready && count === 0 && (
					<p className="rounded-xl border border-dashed border-stone-200 px-3 py-6 text-center text-base text-stone-400">
						No comments yet. Be the first.
					</p>
				)}

				<AnimatePresence initial={false}>
					{comments.map((comment) => (
						<motion.article
							key={comment.id}
							layout={!reduceMotion}
							initial={reduceMotion ? false : { opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={
								reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }
							}
							className="flex flex-col gap-1.5 border-b border-stone-100 py-4 last:border-b-0"
						>
							<div className="flex items-center gap-2">
								<span
									aria-hidden="true"
									className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-medium text-stone-500"
								>
									{comment.author.charAt(0).toUpperCase()}
								</span>
								<span className="text-base font-medium text-stone-900">{comment.author}</span>
								<span aria-hidden="true" className="text-stone-300">
									&middot;
								</span>
								<time
									dateTime={new Date(comment.createdAt).toISOString()}
									className="text-base text-stone-400"
								>
									{relativeTime(comment.createdAt)}
								</time>
							</div>
							<p className="pl-9 text-base leading-6 whitespace-pre-wrap text-stone-600">
								{comment.body}
							</p>
						</motion.article>
					))}
				</AnimatePresence>
			</div>

			<p className="text-sm text-stone-400">
				Comments are stored on your device for now, until a backend is connected.
			</p>
		</section>
	);
}
