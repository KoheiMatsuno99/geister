import { useCallback, useState } from "react";
import { calculateBestMove } from "../game/ai/engine";
import { createInitialGameState } from "../game/gameInit";
import { canMove, checkWinCondition, executeMove } from "../game/rules";
import type { Difficulty } from "../types/ai";
import type { GameState, Ghost, Player, Position } from "../types/game";

export interface UseGameStateResult {
	gameState: GameState;
	isAiThinking: boolean;
	winner: Player | null;
	winCondition: "capture_all_blue" | "lose_all_red" | "escape" | null;
	handleCellClick: (position: Position) => void;
	handleGhostClick: (ghost: Ghost) => void;
	resetGame: () => void;
	setDifficulty: (difficulty: Difficulty) => void;
	executeAiMove: () => Promise<void>;
}

export const useGameState = (): UseGameStateResult => {
	const [gameState, setGameState] = useState<GameState>(createInitialGameState);
	const [isAiThinking, setIsAiThinking] = useState(false);
	const [difficulty, setDifficultyState] = useState<Difficulty>("medium");

	const { winner, condition: winCondition } = checkWinCondition(gameState);

	const resetGame = useCallback(() => {
		setGameState(createInitialGameState());
		setIsAiThinking(false);
	}, []);

	const setDifficulty = useCallback((newDifficulty: Difficulty) => {
		setDifficultyState(newDifficulty);
	}, []);

	const executeAiMove = useCallback(async () => {
		if (isAiThinking || gameState.currentPlayer !== "computer" || winner) {
			return;
		}

		setIsAiThinking(true);

		try {
			const aiMove = await calculateBestMove(gameState, difficulty);

			const moveWithRevealedGhosts = {
				...aiMove,
				ghost: {
					...aiMove.ghost,
					isRevealed: aiMove.capturedGhost ? true : aiMove.ghost.isRevealed,
				},
				capturedGhost: aiMove.capturedGhost
					? {
							...aiMove.capturedGhost,
							isRevealed: true,
						}
					: undefined,
			};

			const newGameState = executeMove(gameState, moveWithRevealedGhosts);
			setGameState(newGameState);
		} catch (error) {
			console.error("AI move failed:", error);
		} finally {
			setIsAiThinking(false);
		}
	}, [gameState, difficulty, isAiThinking, winner]);

	const executePlayerMove = useCallback((from: Position, to: Position) => {
		setGameState((currentGameState) => {
			const ghost = currentGameState.board[from.row][from.col];
			if (!ghost) return currentGameState;

			const capturedGhost = currentGameState.board[to.row][to.col];

			const move = {
				from,
				to,
				ghost: {
					...ghost,
					isRevealed: capturedGhost ? true : ghost.isRevealed,
				},
				capturedGhost: capturedGhost
					? {
							...capturedGhost,
							isRevealed: true,
						}
					: undefined,
			};

			return executeMove(currentGameState, move);
		});
	}, []);

	const handleCellClick = useCallback(
		(position: Position) => {
			setGameState((currentGameState) => {
				if (
					currentGameState.currentPlayer !== "player" ||
					isAiThinking ||
					winner
				) {
					return currentGameState;
				}

				if (currentGameState.selectedPiece) {
					// Try to move selected piece to clicked position
					if (
						canMove(
							currentGameState,
							currentGameState.selectedPiece.position,
							position,
						)
					) {
						executePlayerMove(
							currentGameState.selectedPiece.position,
							position,
						);
					}

					// Clear selection
					return {
						...currentGameState,
						selectedPiece: null,
					};
				}

				return currentGameState;
			});
		},
		[isAiThinking, winner, executePlayerMove],
	);

	const handleGhostClick = useCallback(
		(ghost: Ghost) => {
			setGameState((currentGameState) => {
				if (
					currentGameState.currentPlayer !== "player" ||
					ghost.owner !== "player" ||
					isAiThinking ||
					winner
				) {
					return currentGameState;
				}

				// Select or deselect the ghost
				return {
					...currentGameState,
					selectedPiece:
						currentGameState.selectedPiece?.id === ghost.id ? null : ghost,
				};
			});
		},
		[isAiThinking, winner],
	);

	return {
		gameState,
		isAiThinking,
		winner: winner || null,
		winCondition: winCondition || null,
		handleCellClick,
		handleGhostClick,
		resetGame,
		setDifficulty,
		executeAiMove,
	};
};
