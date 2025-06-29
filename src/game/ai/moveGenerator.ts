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

	console.log(`Generating moves for ${gameState.currentPlayer}:`, {
		ghosts: currentPlayerGhosts.length,
		capturedGhosts: gameState.capturedGhosts.length,
	});

	const validGhosts = currentPlayerGhosts.filter(
		(ghost) => !gameState.capturedGhosts.includes(ghost),
	);
	console.log(
		"Valid ghosts for moves:",
		validGhosts.map((g) => `${g.id}@(${g.position.row},${g.position.col})`),
	);

	const moves = validGhosts.flatMap((ghost) => {
		const adjacentPositions = getAdjacentPositions(ghost.position);
		const validMoves = adjacentPositions
			.filter((toPosition) => canMove(gameState, ghost.position, toPosition))
			.map((toPosition) => {
				const capturedGhost = gameState.board[toPosition.row][toPosition.col];
				return {
					from: ghost.position,
					to: toPosition,
					ghost,
					capturedGhost: capturedGhost || undefined,
				};
			});

		console.log(
			`Ghost ${ghost.id} at (${ghost.position.row},${ghost.position.col}) can make ${validMoves.length} moves`,
		);
		validMoves.forEach((move) => {
			console.log(
				`  - Move to (${move.to.row},${move.to.col})${move.capturedGhost ? ` capturing ${move.capturedGhost.color} ${move.capturedGhost.owner}` : ""}`,
			);
		});

		return validMoves;
	});

	console.log(`Total moves generated: ${moves.length}`);
	return moves;
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
