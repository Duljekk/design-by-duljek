'use client';

interface Props {
	questions: readonly string[];
	onSelect: (question: string) => void;
}

export function SuggestionChips({ questions, onSelect }: Props) {
	return (
		<div className="flex flex-wrap gap-2 px-4 pb-3">
			{questions.map((question) => (
				<button
					key={question}
					type="button"
					onClick={() => onSelect(question)}
					className="rounded-full border border-stone-200 px-3 py-1.5 text-xs text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
				>
					{question}
				</button>
			))}
		</div>
	);
}
