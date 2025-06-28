import type { GameState, Move } from "./game";

export type Difficulty = "easy" | "medium" | "hard";

export interface AIConfig {
	difficulty: Difficulty;
	thinkingTimeMs: number;
	maxDepth: number;
}

export interface MoveScore {
	move: Move;
	score: number;
}

export interface AIEngine {
	calculateBestMove(gameState: GameState): Promise<Move>;
	evaluatePosition(gameState: GameState): number;
	generatePossibleMoves(gameState: GameState): Move[];
}

export interface AIStrategy {
	name: string;
	description: string;
	evaluateMove(gameState: GameState, move: Move): number;
}
