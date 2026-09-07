'use client';

import { useEffect, useState } from 'react';

interface Props {
	title: string;
}

/* Share row. The canonical URL is read from the browser on mount rather than
 * passed in, so it's correct whatever host the post is served from (preview,
 * production, local). Native share is offered when the platform supports it. */
export function ShareButtons({ title }: Props) {
	const [url, setUrl] = useState('');
	const [canNativeShare, setCanNativeShare] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setUrl(window.location.href);
		setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
	}, []);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			/* Clipboard blocked (insecure context / denied permission) — no-op. */
		}
	};

	const nativeShare = async () => {
		try {
			await navigator.share({ title, url });
		} catch {
			/* User dismissed the share sheet — nothing to do. */
		}
	};

	const encodedUrl = encodeURIComponent(url);
	const encodedText = encodeURIComponent(title);
	const xHref = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
	const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

	const linkClass =
		'inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-base text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900';

	return (
		<div className="flex flex-col gap-3 px-3">
			<p className="text-base font-medium text-stone-900">Share this post</p>
			<div className="flex flex-wrap items-center gap-2">
				<button type="button" onClick={copy} className={linkClass} aria-live="polite">
					{copied ? <CheckIcon /> : <LinkIcon />}
					{copied ? 'Copied' : 'Copy link'}
				</button>

				<a href={xHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
					<XIcon />
					Post on X
				</a>

				<a href={linkedInHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
					<LinkedInIcon />
					LinkedIn
				</a>

				{canNativeShare && (
					<button type="button" onClick={nativeShare} className={linkClass}>
						<ShareIcon />
						Share
					</button>
				)}
			</div>
		</div>
	);
}

const iconProps = {
	width: 16,
	height: 16,
	viewBox: '0 0 16 16',
	fill: 'none',
	'aria-hidden': true,
	className: 'size-4 shrink-0',
} as const;

function LinkIcon() {
	return (
		<svg {...iconProps}>
			<path
				d="M6.5 9.5l3-3M7 4.5l.6-.6a2.2 2.2 0 013.1 3.1l-.6.6M9 11.5l-.6.6a2.2 2.2 0 01-3.1-3.1l.6-.6"
				stroke="currentColor"
				strokeWidth={1.4}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg {...iconProps} className="size-4 shrink-0 text-emerald-600">
			<path
				d="M3.5 8.5l3 3 6-6"
				stroke="currentColor"
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function XIcon() {
	return (
		<svg {...iconProps}>
			<path
				d="M3 3l10 10M13 3L3 13"
				stroke="currentColor"
				strokeWidth={1.4}
				strokeLinecap="round"
			/>
		</svg>
	);
}

function LinkedInIcon() {
	return (
		<svg {...iconProps}>
			<path
				d="M4 6.5V12M4 4.2v.05M7 12V8.8c0-1 .7-1.7 1.6-1.7s1.6.7 1.6 1.7V12"
				stroke="currentColor"
				strokeWidth={1.4}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function ShareIcon() {
	return (
		<svg {...iconProps}>
			<path
				d="M8 10V3m0 0L5.5 5.5M8 3l2.5 2.5M4 8v4.5h8V8"
				stroke="currentColor"
				strokeWidth={1.4}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
