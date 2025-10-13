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
		color: string; // tailwind gradient classes
		accentRgba: string; // used for glow/shadow and patterns
	}
> = {
	"definition-match": {
		title: "Definition Match",
		description: "Choose the right word for the definition.",
		icon: "📖",
		color: "from-indigo-500 to-blue-500",
		// indigo-500 (#6366f1)
		accentRgba: "rgba(99,102,241,0.45)",
	},
	"reverse-definition": {
		title: "Reverse Mode",
		description: "Read the word and find the definition.",
		icon: "🔄",
		color: "from-violet-500 to-purple-500",
		// violet-500 -> purple-500
		accentRgba: "rgba(139,92,246,0.45)",
	},
	"fill-in-the-blank": {
		title: "Fill in the Blank",
		description: "Find the word that fits the sentence.",
		icon: "✍️",
		color: "from-emerald-500 to-teal-500",
		accentRgba: "rgba(16,185,129,0.45)",
	},
	"speed-round": {
		title: "Speed Round",
		description: "A timed, rapid-fire challenge.",
		icon: "⚡️",
		color: "from-orange-500 to-amber-500",
		accentRgba: "rgba(245,158,11,0.5)",
	},
	"matching": {
		title: "Matching Game",
		description: "Match words with their definitions.",
		icon: "🧩",
		color: "from-pink-500 to-rose-500",
		accentRgba: "rgba(236,72,153,0.45)",
	},
	"word-scramble": {
		title: "Word Scramble",
		description: "Unscramble letters to find the word.",
		icon: "🔤",
		color: "from-indigo-600 to-violet-500",
		accentRgba: "rgba(79,70,229,0.48)", // indigo-600
	},
};

export function GameModeSelector({ selectedMode, modeStats, onSelect }: GameModeSelectorProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-7">
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
							className={`group relative flex flex-col rounded-3xl overflow-hidden text-left transition-all duration-300 active:scale-[0.985] ${
								isSelected ? "scale-[1.01]" : "hover:scale-[1.01]"
							}`}
							style={{
								minHeight: "240px",
								boxShadow: isSelected
									? `0 0 0 3px ${detail.accentRgba}, 0 24px 64px -20px ${detail.accentRgba}`
									: `0 18px 48px -24px ${detail.accentRgba}`,
							}}
						>
							{/* Gradient base */}
							<div className={`absolute inset-0 bg-gradient-to-br ${detail.color}`} aria-hidden />

							{/* Subtle pattern + gloss */}
							<div
								className="absolute inset-0 opacity-30 mix-blend-overlay"
								style={{
									backgroundImage:
										`radial-gradient(1200px 400px at 10% -20%, rgba(255,255,255,0.45), transparent 60%),` +
										`radial-gradient(800px 300px at 110% 120%, rgba(255,255,255,0.22), transparent 60%)`,
								}}
								aria-hidden
							/>

							{/* Inner glass panel for content */}
							<div className="relative z-10 flex flex-col items-center justify-center flex-1 p-6 md:p-7">
								<div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
									<div className="text-5xl md:text-6xl filter drop-shadow-xl">
										{detail.icon}
									</div>
									<div className="hidden md:block text-white/70 text-5xl leading-none">•</div>
									<h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
										{detail.title}
									</h3>
								</div>
								<p className="text-[15px] md:text-lg text-white/90 text-center leading-snug max-w-[28rem]">
									{detail.description}
								</p>

								{/* Progress bar */}
								<div className="w-full mt-6">
									<div className="h-2.5 w-full rounded-full bg-white/25 overflow-hidden">
										<div
											className="h-full rounded-full"
											style={{
												width: `${accuracy}%`,
												background: `linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7))`,
											}}
										/>
									</div>
									<div className="mt-2 flex items-center justify-between text-white/90">
										<span className="text-sm md:text-base font-semibold tracking-wide">
											{accuracy}% correct
										</span>
										<span className="text-xs md:text-sm text-white/85">
											{stats.attempted === 0
												? "Not played yet"
												: `${stats.attempted} ${stats.attempted === 1 ? "game" : "games"} played`}
										</span>
									</div>
								</div>
							</div>

							{/* Glow ring on hover */}
							<div
								className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-white/10 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
								style={{ boxShadow: `0 0 0 6px ${detail.accentRgba} inset` }}
								aria-hidden
							/>
						</button>
					);
				},
			)}
		</div>
	);
}