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
	spelling: {
		title: "Spelling",
		description: "Type the word you hear defined.",
		icon: "🐝",
		color: "from-pink-500 to-rose-500",
	},
	"example-sentence": {
		title: "Context Clues",
		description: "Use example sentences to find the word.",
		icon: "🖼️",
		color: "from-slate-600 to-slate-900",
	},
};

export function GameModeSelector({ selectedMode, modeStats, onSelect }: GameModeSelectorProps) {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
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
							className={`relative flex h-48 flex-col items-center justify-center rounded-3xl p-4 text-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-100 ${
								isSelected
									? "ring-4 ring-indigo-400 ring-offset-2 ring-offset-slate-50"
									: "shadow-indigo-100/80"
							}`}
						>
							<div
								className={`absolute inset-0 h-full w-full rounded-3xl bg-gradient-to-br ${detail.color} opacity-90`}
								aria-hidden
							/>
							<div className="relative z-10 flex flex-col items-center justify-center">
								<div className="text-5xl drop-shadow-lg md:text-6xl">{detail.icon}</div>
								<h3 className="mt-3 text-lg font-bold text-white drop-shadow-md md:text-xl">
									{detail.title}
								</h3>
								<p className="mt-1 hidden text-xs text-white/90 drop-shadow-sm sm:block">
									{detail.description}
								</p>
							</div>
							<div className="absolute bottom-3 w-full px-2 text-xs text-white">
								<div className="mx-auto w-fit rounded-full bg-black/20 px-3 py-1">
									<span className="font-semibold">{accuracy}%</span> correct ({stats.attempted} played)
								</div>
							</div>
						</button>
					);
				},
			)}
		</div>
	);
}