import type { GameState, Move, Position } from "../../types/game";
import { BOARD_SIZE, canMove } from "../rules";

/**
 * Generates all possible moves for the current player.
 */
export const generatePossibleMoves = (gameState: GameState): Move[] => {
	const currentPlayerGhosts =
		gameState.currentPlayer === "player"
			? gameState.playerGhosts
			: gameState.computerGhosts;

	return currentPlayerGhosts
		.filter((ghost) => !gameState.capturedGhosts.includes(ghost))
		.flatMap((ghost) => 
			getAdjacentPositions(ghost.position)
				.filter((toPosition) => canMove(gameState, ghost.position, toPosition))
				.map((toPosition) => ({
					from: ghost.position,
					to: toPosition,
					ghost,
					capturedGhost: gameState.board[toPosition.row][toPosition.col] || undefined,
				}))
		);
};

/**
 * Gets all adjacent positions (up, down, left, right) for a given position.
 */
const getAdjacentPositions = (position: Position): Position[] => {
	const directions = [
		{ row: -1, col: 0 }, // up
		{ row: 1, col: 0 }, // down
		{ row: 0, col: -1 }, // left
		{ row: 0, col: 1 }, // right
	];

	return directions
		.map((direction) => ({
			row: position.row + direction.row,
			col: position.col + direction.col,
		}))
		.filter(isWithinBoard);
};

const isWithinBoard = (position: Position): boolean => {
	return (
		position.row >= 0 &&
		position.row < BOARD_SIZE &&
		position.col >= 0 &&
		position.col < BOARD_SIZE
	);
};
