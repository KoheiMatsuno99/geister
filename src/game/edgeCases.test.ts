import { describe, expect, it } from "vitest";
import type { GameState, Ghost } from "../types/game";
import { evaluatePosition } from "./ai/evaluator";
import { generatePossibleMoves } from "./ai/moveGenerator";
import {
	BOARD_SIZE,
	canMove,
	checkWinCondition,
	executeMove,
	isEscapeSquare,
	isValidPosition,
} from "./rules";

describe("Edge Cases", () => {
	const createGameState = (
		playerGhosts: Ghost[],
		computerGhosts: Ghost[],
		capturedGhosts: Ghost[] = [],
	): GameState => {
		const board = Array(BOARD_SIZE)
			.fill(null)
			.map(() => Array(BOARD_SIZE).fill(null));

		const allGhosts = [...playerGhosts, ...computerGhosts].filter(
			(ghost) => !capturedGhosts.includes(ghost),
		);

		for (const ghost of allGhosts) {
			board[ghost.position.row][ghost.position.col] = ghost;
		}

		return {
			board,
			currentPlayer: "player",
			gamePhase: "playing",
			selectedPiece: null,
			moveHistory: [],
			playerGhosts,
			computerGhosts,
			capturedGhosts,
		};
	};

	describe("Boundary Conditions", () => {
		it("should handle board boundaries correctly", () => {
			// Test all corners and edges
			const positions = [
				{ row: 0, col: 0 }, // top-left
				{ row: 0, col: 5 }, // top-right
				{ row: 5, col: 0 }, // bottom-left
				{ row: 5, col: 5 }, // bottom-right
				{ row: 0, col: 3 }, // top edge
				{ row: 5, col: 3 }, // bottom edge
				{ row: 3, col: 0 }, // left edge
				{ row: 3, col: 5 }, // right edge
			];

			for (const pos of positions) {
				expect(isValidPosition(pos)).toBe(true);
			}

			// Test invalid positions
			const invalidPositions = [
				{ row: -1, col: 0 },
				{ row: 0, col: -1 },
				{ row: 6, col: 0 },
				{ row: 0, col: 6 },
				{ row: -1, col: -1 },
				{ row: 6, col: 6 },
			];

			for (const pos of invalidPositions) {
				expect(isValidPosition(pos)).toBe(false);
			}
		});

		it("should correctly identify escape squares", () => {
			// Player escape squares (top corners)
			expect(isEscapeSquare({ row: 0, col: 0 }, "player")).toBe(true);
			expect(isEscapeSquare({ row: 0, col: 5 }, "player")).toBe(true);
			expect(isEscapeSquare({ row: 0, col: 2 }, "player")).toBe(false);

			// Computer escape squares (bottom corners)
			expect(isEscapeSquare({ row: 5, col: 0 }, "computer")).toBe(true);
			expect(isEscapeSquare({ row: 5, col: 5 }, "computer")).toBe(true);
			expect(isEscapeSquare({ row: 5, col: 2 }, "computer")).toBe(false);

			// Non-escape squares
			expect(isEscapeSquare({ row: 2, col: 0 }, "player")).toBe(false);
			expect(isEscapeSquare({ row: 2, col: 0 }, "computer")).toBe(false);
		});
	});

	describe("Game State Edge Cases", () => {
		it("should handle empty board gracefully", () => {
			const gameState = createGameState([], []);

			const moves = generatePossibleMoves(gameState);
			expect(moves).toHaveLength(0);

			const winCondition = checkWinCondition(gameState);
			// Empty board means all blue ghosts are captured, so computer wins
			expect(winCondition.winner).toBe("computer");
			expect(winCondition.condition).toBe("capture_all_blue");
		});

		it("should handle single ghost scenarios", () => {
			const singleGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createGameState([singleGhost], []);

			const moves = generatePossibleMoves(gameState);
			expect(moves.length).toBe(4); // Should have 4 moves from center

			const evaluation = evaluatePosition(gameState, "player");
			expect(evaluation).toBeGreaterThan(0); // Should favor player
		});

		it("should handle all ghosts captured scenario", () => {
			const playerGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: true,
			};

			const computerGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 3, col: 3 },
				owner: "computer",
				isRevealed: true,
			};

			// All ghosts captured
			const gameState = createGameState([], [], [playerGhost, computerGhost]);

			const moves = generatePossibleMoves(gameState);
			expect(moves).toHaveLength(0);

			const winCondition = checkWinCondition(gameState);
			expect(winCondition.winner).toBeDefined(); // Should have a winner
		});

		it("should handle simultaneous win conditions", () => {
			// Player blue ghost at escape square, but all computer blue ghosts captured
			const playerBlueGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 0, col: 0 }, // Escape square
				owner: "player",
				isRevealed: false,
			};

			const computerBlueGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 3, col: 3 },
				owner: "computer",
				isRevealed: true,
			};

			const gameState = createGameState(
				[playerBlueGhost],
				[],
				[computerBlueGhost], // Computer blue captured
			);

			const winCondition = checkWinCondition(gameState);
			// Escape should take priority over capture
			expect(winCondition.winner).toBe("player");
			expect(winCondition.condition).toBe("escape");
		});
	});

	describe("Move Validation Edge Cases", () => {
		it("should reject moves from empty squares", () => {
			const ghost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createGameState([ghost], []);

			// Try to move from empty square
			const canMoveFromEmpty = canMove(
				gameState,
				{ row: 1, col: 1 }, // empty square
				{ row: 1, col: 2 },
			);

			expect(canMoveFromEmpty).toBe(false);
		});

		it("should reject moves by opponent ghosts", () => {
			const playerGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const computerGhost: Ghost = {
				id: "c1",
				color: "red",
				position: { row: 3, col: 3 },
				owner: "computer",
				isRevealed: false,
			};

			const gameState = createGameState([playerGhost], [computerGhost]);
			gameState.currentPlayer = "player";

			// Try to move computer ghost on player turn
			const canMoveOpponent = canMove(
				gameState,
				{ row: 3, col: 3 }, // computer ghost
				{ row: 3, col: 4 },
			);

			expect(canMoveOpponent).toBe(false);
		});

		it("should handle diagonal move attempts", () => {
			const ghost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createGameState([ghost], []);

			// Try diagonal moves
			const diagonalMoves = [
				{ from: { row: 2, col: 2 }, to: { row: 1, col: 1 } },
				{ from: { row: 2, col: 2 }, to: { row: 1, col: 3 } },
				{ from: { row: 2, col: 2 }, to: { row: 3, col: 1 } },
				{ from: { row: 2, col: 2 }, to: { row: 3, col: 3 } },
			];

			for (const move of diagonalMoves) {
				expect(canMove(gameState, move.from, move.to)).toBe(false);
			}
		});

		it("should handle distant move attempts", () => {
			const ghost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createGameState([ghost], []);

			// Try moves more than one square
			const distantMoves = [
				{ from: { row: 2, col: 2 }, to: { row: 0, col: 2 } }, // 2 up
				{ from: { row: 2, col: 2 }, to: { row: 4, col: 2 } }, // 2 down
				{ from: { row: 2, col: 2 }, to: { row: 2, col: 0 } }, // 2 left
				{ from: { row: 2, col: 2 }, to: { row: 2, col: 4 } }, // 2 right
			];

			for (const move of distantMoves) {
				expect(canMove(gameState, move.from, move.to)).toBe(false);
			}
		});
	});

	describe("Game State Mutations", () => {
		it("should not mutate original game state in executeMove", () => {
			const originalGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const originalGameState = createGameState([originalGhost], []);
			const originalBoardState = originalGameState.board.map((row) => [...row]);
			const originalCapturedLength = originalGameState.capturedGhosts.length;

			const move = {
				from: { row: 2, col: 2 },
				to: { row: 1, col: 2 },
				ghost: originalGhost,
			};

			const newGameState = executeMove(originalGameState, move);

			// Original state should be unchanged
			expect(originalGameState.board).toEqual(originalBoardState);
			expect(originalGameState.capturedGhosts).toHaveLength(
				originalCapturedLength,
			);
			expect(originalGameState.currentPlayer).toBe("player");

			// New state should be different
			expect(newGameState.board).not.toEqual(originalBoardState);
			expect(newGameState.currentPlayer).toBe("computer");
		});

		it("should handle move history correctly", () => {
			const ghost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createGameState([ghost], []);
			expect(gameState.moveHistory).toHaveLength(0);

			const move = {
				from: { row: 2, col: 2 },
				to: { row: 1, col: 2 },
				ghost,
			};

			const newGameState = executeMove(gameState, move);
			expect(newGameState.moveHistory).toHaveLength(1);
			expect(newGameState.moveHistory[0]).toEqual(move);
		});
	});

	describe("AI Evaluation Edge Cases", () => {
		it("should handle evaluation with no ghosts", () => {
			const gameState = createGameState([], []);

			const playerEval = evaluatePosition(gameState, "player");
			const computerEval = evaluatePosition(gameState, "computer");

			// Should not crash and return reasonable values
			expect(typeof playerEval).toBe("number");
			expect(typeof computerEval).toBe("number");
		});

		it("should handle evaluation with extreme positions", () => {
			// Computer blue ghost about to escape, with balanced setup
			const computerBlueGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 4, col: 0 }, // One move from escape
				owner: "computer",
				isRevealed: false,
			};

			const computerRedGhost: Ghost = {
				id: "c2",
				color: "red",
				position: { row: 1, col: 1 },
				owner: "computer",
				isRevealed: false,
			};

			const playerBlueGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 1, col: 5 },
				owner: "player",
				isRevealed: false,
			};

			const playerRedGhost: Ghost = {
				id: "p2",
				color: "red",
				position: { row: 4, col: 5 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createGameState(
				[playerBlueGhost, playerRedGhost],
				[computerBlueGhost, computerRedGhost],
			);

			const computerEval = evaluatePosition(gameState, "computer");
			const playerEval = evaluatePosition(gameState, "player");

			// Computer should have advantage due to escape threat
			expect(computerEval).toBeGreaterThan(playerEval);
			expect(computerEval).toBeGreaterThan(100); // Should include escape bonus
		});
	});
});
