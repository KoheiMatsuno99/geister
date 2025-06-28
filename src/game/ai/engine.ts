import type { Difficulty } from "../../types/ai";
import type { GameState, Move } from "../../types/game";
import { executeMove } from "../rules";
import { evaluatePosition } from "./evaluator";
import { generatePossibleMoves } from "./moveGenerator";

/**
 * Calculates the best move for the computer player using minimax algorithm.
 */
export const calculateBestMove = async (
	gameState: GameState,
	difficulty: Difficulty = "medium",
): Promise<Move> => {
	const moves = generatePossibleMoves(gameState);

	if (moves.length === 0) {
		throw new Error("No valid moves available");
	}

	// Add thinking delay for better UX
	const thinkingTime = getThinkingTimeForDifficulty(difficulty);
	await new Promise((resolve) => setTimeout(resolve, thinkingTime));

	const maxDepth = getMaxDepthForDifficulty(difficulty);

	// Functional approach: find best move using reduce
	return moves.reduce(
		(bestMove, currentMove) => {
			const newGameState = executeMove(gameState, currentMove);
			const score = minimax(
				newGameState,
				maxDepth - 1,
				false,
				Number.NEGATIVE_INFINITY,
				Number.POSITIVE_INFINITY,
			);

			return score > bestMove.score ? { move: currentMove, score } : bestMove;
		},
		{ move: moves[0], score: Number.NEGATIVE_INFINITY },
	).move;
};

/**
 * Minimax algorithm with alpha-beta pruning.
 */
const minimax = (
	gameState: GameState,
	depth: number,
	isMaximizing: boolean,
	alpha: number,
	beta: number,
): number => {
	if (depth === 0) {
		return evaluatePosition(gameState, "computer");
	}

	const moves = generatePossibleMoves(gameState);

	if (moves.length === 0) {
		return evaluatePosition(gameState, "computer");
	}

	return isMaximizing
		? maximizeMove(gameState, moves, depth, alpha, beta)
		: minimizeMove(gameState, moves, depth, alpha, beta);
};

const maximizeMove = (
	gameState: GameState,
	moves: Move[],
	depth: number,
	alpha: number,
	beta: number,
): number => {
	const result = moves.reduce(
		(acc, move) => {
			if (acc.pruned) return acc;

			const newGameState = executeMove(gameState, move);
			const evaluation = minimax(
				newGameState,
				depth - 1,
				false,
				acc.alpha,
				beta,
			);
			const maxEval = Math.max(acc.maxEval, evaluation);
			const currentAlpha = Math.max(acc.alpha, evaluation);

			return {
				maxEval,
				alpha: currentAlpha,
				pruned: beta <= currentAlpha,
			};
		},
		{
			maxEval: Number.NEGATIVE_INFINITY,
			alpha,
			pruned: false,
		},
	);

	return result.maxEval;
};

const minimizeMove = (
	gameState: GameState,
	moves: Move[],
	depth: number,
	alpha: number,
	beta: number,
): number => {
	const result = moves.reduce(
		(acc, move) => {
			if (acc.pruned) return acc;

			const newGameState = executeMove(gameState, move);
			const evaluation = minimax(
				newGameState,
				depth - 1,
				true,
				alpha,
				acc.beta,
			);
			const minEval = Math.min(acc.minEval, evaluation);
			const currentBeta = Math.min(acc.beta, evaluation);

			return {
				minEval,
				beta: currentBeta,
				pruned: currentBeta <= alpha,
			};
		},
		{
			minEval: Number.POSITIVE_INFINITY,
			beta,
			pruned: false,
		},
	);

	return result.minEval;
};

const getMaxDepthForDifficulty = (difficulty: Difficulty): number => {
	const depthMap: Record<Difficulty, number> = {
		easy: 1,
		medium: 3,
		hard: 5,
	};

	return depthMap[difficulty] ?? 3;
};

const getThinkingTimeForDifficulty = (difficulty: Difficulty): number => {
	const timeMap: Record<Difficulty, number> = {
		easy: 500, // 0.5 seconds
		medium: 1000, // 1 second
		hard: 2000, // 2 seconds
	};

	return timeMap[difficulty] ?? 1000;
};
