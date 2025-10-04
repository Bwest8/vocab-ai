"use client";

import type { GameMode } from "@/lib/games/types";
import type { ModeStats } from "../hooks/useGameProgress";

interface GameModeSelectorProps {
	selectedMode: GameMode;
	modeStats: Record<GameMode, ModeStats>;
	onSelect: (mode: GameMode) => void;
}

const modeDetails: Record<
	GameMode,
	{
		title: string;
		description: string;
		badge: string;
		color: string;
	}
> = {
	"definition-match": {
		title: "Definition Match",
		description: "Read the definition and choose the correct word. Perfect for previewing the week's list.",
		badge: "Days 1-2",
		color: "from-indigo-500 to-blue-500",
	},
	"reverse-definition": {
		title: "Reverse Mode",
		description: "Flip the script—see the word first and spot the matching definition.",
		badge: "Day 3",
		color: "from-violet-500 to-purple-500",
	},
	"fill-in-the-blank": {
		title: "Fill in the Blank",
		description: "Complete the sentence with the vocabulary word that fits best.",
		badge: "Day 4",
		color: "from-emerald-500 to-teal-500",
	},
	"speed-round": {
		title: "Speed Round",
		description: "60 seconds of rapid-fire questions to check mastery and earn bonus points.",
		badge: "Day 5",
		color: "from-orange-500 to-amber-500",
	},
	spelling: {
		title: "Spelling Challenge",
		description: "Hear the definition, type the word, and build spelling confidence.",
		badge: "Day 6",
		color: "from-pink-500 to-rose-500",
	},
	"example-sentence": {
		title: "Context Clues",
		description: "Use example sentences to choose the word that fits—great for weekly review.",
		badge: "Day 7",
		color: "from-slate-600 to-slate-900",
	},
};

export function GameModeSelector({ selectedMode, modeStats, onSelect }: GameModeSelectorProps) {
	return (
		<div className="grid gap-4 lg:grid-cols-3">
			{(Object.entries(modeDetails) as Array<[GameMode, typeof modeDetails[GameMode]]>).map(
				([mode, detail]) => {
					const stats = modeStats[mode];
					const accuracy = stats.attempted === 0 ? 0 : Math.round((stats.correct / stats.attempted) * 100);
					const isSelected = selectedMode === mode;

					return (
									<button
										key={mode}
										type="button"
										onClick={() => onSelect(mode)}
										className={`relative overflow-hidden rounded-3xl border px-5 py-6 text-left shadow-sm transition-all ${
											isSelected
												? "border-indigo-500 shadow-indigo-200"
												: "border-transparent hover:border-slate-200 hover:shadow-lg"
										}`}
									>
										<div
											className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 ${detail.color}`}
											aria-hidden
										/>
							<span className="inline-flex rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
								{detail.badge}
							</span>
							<h3 className="mt-4 text-lg font-semibold text-slate-900">{detail.title}</h3>
							<p className="mt-2 text-sm text-slate-500">{detail.description}</p>

							<div className="mt-5 flex items-center justify-between text-xs text-slate-500">
								<span>{stats.attempted} played</span>
								<span className="font-semibold text-indigo-600">{accuracy}% accurate</span>
							</div>
						</button>
					);
				}
			)}
		</div>
	);
}
