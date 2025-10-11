"use client";

import type { GameMode, ModeStats } from "@/lib/types";

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
		icon: string;
		color: string;
	}
> = {
	"definition-match": {
		title: "Definition Match",
		description: "Choose the right word for the definition.",
		icon: "📖",
		color: "from-indigo-500 to-blue-500",
	},
	"reverse-definition": {
		title: "Reverse Mode",
		description: "Read the word and find the definition.",
		icon: "🔄",
		color: "from-violet-500 to-purple-500",
	},
	"fill-in-the-blank": {
		title: "Fill in the Blank",
		description: "Find the word that fits the sentence.",
		icon: "✍️",
		color: "from-emerald-500 to-teal-500",
	},
	"speed-round": {
		title: "Speed Round",
		description: "A timed, rapid-fire challenge.",
		icon: "⚡️",
		color: "from-orange-500 to-amber-500",
	},
	"matching": {
		title: "Matching Game",
		description: "Match words with their definitions.",
		icon: "🧩",
		color: "from-pink-500 to-rose-500",
	},
};

export function GameModeSelector({ selectedMode, modeStats, onSelect }: GameModeSelectorProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
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
							className={`relative flex flex-col items-center justify-between rounded-3xl p-6 pb-4 text-center shadow-lg transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] overflow-hidden ${
								isSelected
									? "ring-4 ring-white ring-offset-4 ring-offset-slate-100"
									: ""
							}`}
							style={{ minHeight: '220px' }}
						>
							<div
								className={`absolute inset-0 h-full w-full bg-gradient-to-br ${detail.color}`}
								aria-hidden
							/>
							<div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
								<div className="text-5xl md:text-6xl mb-3 filter drop-shadow-lg">{detail.icon}</div>
								<h3 className="text-xl md:text-2xl font-bold text-white mb-2 px-2">
									{detail.title}
								</h3>
								<p className="text-sm md:text-base text-white/90 px-4 leading-snug max-w-xs">
									{detail.description}
								</p>
							</div>
							<div className="relative z-10 w-full mt-4">
								<div className="rounded-2xl bg-black/25 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-white border border-white/20">
									<div className="font-bold text-base">{accuracy}% correct</div>
									<div className="text-xs text-white/80 mt-0.5">
										{stats.attempted === 0 ? 'Not played yet' : `${stats.attempted} ${stats.attempted === 1 ? 'game' : 'games'} played`}
									</div>
								</div>
							</div>
						</button>
					);
				},
			)}
		</div>
	);
}