import { useCallback, useState } from "react";
import { calculateBestMove } from "../game/ai/engine";
import {
	createInitialGameState,
	placePlayerGhost,
	startGamePhase,
} from "../game/gameInit";
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
	handleGhostMove: (ghost: Ghost, newPosition: Position) => void;
	handlePlaceGhost: (ghost: Ghost, position: Position) => void;
	handleStartGamePhase: () => void;
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

	const handleCellClick = useCallback(
		(position: Position) => {
			setGameState((currentGameState) => {
				if (
					currentGameState.gamePhase !== "playing" ||
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
						// Execute move directly within this state update
						const ghost =
							currentGameState.board[
								currentGameState.selectedPiece.position.row
							][currentGameState.selectedPiece.position.col];
						if (ghost) {
							const capturedGhost =
								currentGameState.board[position.row][position.col];

							const move = {
								from: currentGameState.selectedPiece.position,
								to: position,
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

							const newGameState = executeMove(currentGameState, move);
							const finalGameState = {
								...newGameState,
								selectedPiece: null,
							};

							// If it's now computer's turn, schedule AI move
							if (finalGameState.currentPlayer === "computer") {
								setTimeout(() => executeAiMove(), 100);
							}

							return finalGameState;
						}
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
		[isAiThinking, winner, executeAiMove],
	);

	const handleGhostClick = useCallback(
		(ghost: Ghost) => {
			setGameState((currentGameState) => {
				if (
					currentGameState.gamePhase !== "playing" ||
					currentGameState.currentPlayer !== "player" ||
					ghost.owner !== "player" ||
					isAiThinking ||
					winner
				) {
					return currentGameState;
				}

				// Select or deselect the ghost
				const newSelectedPiece =
					currentGameState.selectedPiece?.id === ghost.id ? null : ghost;

				return {
					...currentGameState,
					selectedPiece: newSelectedPiece,
				};
			});
		},
		[isAiThinking, winner],
	);

	const handlePlaceGhost = useCallback((ghost: Ghost, position: Position) => {
		setGameState((currentGameState) => {
			try {
				return placePlayerGhost(currentGameState, ghost, position);
			} catch (error) {
				console.error("Failed to place ghost:", error);
				return currentGameState;
			}
		});
	}, []);

	const handleGhostMove = useCallback(
		(ghost: Ghost, newPosition: Position) => {
			setGameState((currentGameState) => {
				if (
					currentGameState.gamePhase !== "playing" ||
					currentGameState.currentPlayer !== "player" ||
					ghost.owner !== "player" ||
					isAiThinking ||
					winner
				) {
					return currentGameState;
				}

				if (canMove(currentGameState, ghost.position, newPosition)) {
					// Execute move directly within this state update
					const capturedGhost =
						currentGameState.board[newPosition.row][newPosition.col];

					const move = {
						from: ghost.position,
						to: newPosition,
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

					const newGameState = executeMove(currentGameState, move);

					// If it's now computer's turn, schedule AI move
					if (newGameState.currentPlayer === "computer") {
						setTimeout(() => executeAiMove(), 100);
					}

					return newGameState;
				}

				return currentGameState;
			});
		},
		[isAiThinking, winner, executeAiMove],
	);

	const handleStartGamePhase = useCallback(() => {
		setGameState((currentGameState) => {
			try {
				return startGamePhase(currentGameState);
			} catch (error) {
				console.error("Failed to start game phase:", error);
				return currentGameState;
			}
		});
	}, []);

	return {
		gameState,
		isAiThinking,
		winner: winner || null,
		winCondition: winCondition || null,
		handleCellClick,
		handleGhostClick,
		handleGhostMove,
		handlePlaceGhost,
		handleStartGamePhase,
		resetGame,
		setDifficulty,
		executeAiMove,
	};
};
