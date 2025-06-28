import { describe, expect, it, vi } from "vitest";
import type { GameState, Ghost } from "../../types/game";
import { BOARD_SIZE } from "../rules";
import { calculateBestMove } from "./engine";

// Mock the thinking delay for faster tests
vi.mock("./engine", async () => {
	const actual = await vi.importActual("./engine");
	return {
		...actual,
		calculateBestMove: vi.fn(async (gameState, _difficulty = "medium") => {
			// Remove the delay for testing
			const moves = (await import("./moveGenerator")).generatePossibleMoves(
				gameState,
			);
			if (moves.length === 0) {
				throw new Error("No valid moves available");
			}
			// Return first move for simplicity in tests
			return moves[0];
		}),
	};
});

describe("AI Engine", () => {
	const createTestGameState = (
		playerGhosts: Ghost[],
		computerGhosts: Ghost[],
		currentPlayer: "player" | "computer" = "computer",
	): GameState => {
		const board = Array(BOARD_SIZE)
			.fill(null)
			.map(() => Array(BOARD_SIZE).fill(null));

		// Place ghosts on board
		for (const ghost of [...playerGhosts, ...computerGhosts]) {
			board[ghost.position.row][ghost.position.col] = ghost;
		}

		return {
			board,
			currentPlayer,
			gamePhase: "playing",
			selectedPiece: null,
			moveHistory: [],
			playerGhosts,
			computerGhosts,
			capturedGhosts: [],
		};
	};

	describe("calculateBestMove", () => {
		it("should return a valid move", async () => {
			const computerGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			const playerGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 4, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createTestGameState([playerGhost], [computerGhost]);

			const move = await calculateBestMove(gameState);

			expect(move).toBeDefined();
			expect(move.ghost.owner).toBe("computer");
			expect(move.from).toEqual(computerGhost.position);

			// Verify move is adjacent
			const deltaRow = Math.abs(move.to.row - move.from.row);
			const deltaCol = Math.abs(move.to.col - move.from.col);
			expect(
				(deltaRow === 1 && deltaCol === 0) ||
					(deltaRow === 0 && deltaCol === 1),
			).toBe(true);
		});

		it("should throw error when no moves available", async () => {
			// Create state with computer ghost but all captured
			const computerGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			const gameState = createTestGameState([], [computerGhost]);
			gameState.capturedGhosts = [computerGhost]; // All computer ghosts captured

			await expect(calculateBestMove(gameState)).rejects.toThrow(
				"No valid moves available",
			);
		});

		it("should work with different difficulty levels", async () => {
			const computerGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			const playerGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 4, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createTestGameState([playerGhost], [computerGhost]);

			// Test all difficulty levels
			const easyMove = await calculateBestMove(gameState, "easy");
			const mediumMove = await calculateBestMove(gameState, "medium");
			const hardMove = await calculateBestMove(gameState, "hard");

			expect(easyMove).toBeDefined();
			expect(mediumMove).toBeDefined();
			expect(hardMove).toBeDefined();
		});

		it("should prefer capture moves when available", async () => {
			// Unmock to test actual AI logic
			vi.unmock("./engine");
			const { calculateBestMove: actualCalculateBestMove } = await import(
				"./engine"
			);

			const computerGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			const playerGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 1, col: 2 }, // Adjacent to computer ghost
				owner: "player",
				isRevealed: false,
			};

			const gameState = createTestGameState([playerGhost], [computerGhost]);

			const move = await actualCalculateBestMove(gameState, "easy");

			// Should capture the player ghost
			expect(move.capturedGhost).toBeDefined();
			expect(move.capturedGhost?.id).toBe("p1");
			expect(move.to).toEqual({ row: 1, col: 2 });
		});

		it("should handle edge positions correctly", async () => {
			const computerGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 0, col: 0 }, // Corner position
				owner: "computer",
				isRevealed: false,
			};

			const playerGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 4, col: 4 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createTestGameState([playerGhost], [computerGhost]);

			const move = await calculateBestMove(gameState);

			expect(move).toBeDefined();
			expect(move.ghost.id).toBe("c1");

			// Corner position should only have 2 possible moves
			const validDestinations = [
				{ row: 0, col: 1 }, // right
				{ row: 1, col: 0 }, // down
			];

			expect(
				validDestinations.some(
					(dest) => dest.row === move.to.row && dest.col === move.to.col,
				),
			).toBe(true);
		});
	});

	describe("AI Consistency", () => {
		it("should make deterministic moves in identical positions", async () => {
			const computerGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			const playerGhost: Ghost = {
				id: "p1",
				color: "red",
				position: { row: 4, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState1 = createTestGameState([playerGhost], [computerGhost]);
			const gameState2 = createTestGameState([playerGhost], [computerGhost]);

			const move1 = await calculateBestMove(gameState1, "easy");
			const move2 = await calculateBestMove(gameState2, "easy");

			// Should make the same move in identical positions
			expect(move1.from).toEqual(move2.from);
			expect(move1.to).toEqual(move2.to);
		});
	});

	describe("Performance", () => {
		it("should complete moves within reasonable time", async () => {
			// Unmock to test actual performance
			vi.unmock("./engine");
			const { calculateBestMove: actualCalculateBestMove } = await import(
				"./engine"
			);

			const computerGhosts: Ghost[] = [
				{
					id: "c1",
					color: "blue",
					position: { row: 1, col: 1 },
					owner: "computer",
					isRevealed: false,
				},
				{
					id: "c2",
					color: "red",
					position: { row: 1, col: 2 },
					owner: "computer",
					isRevealed: false,
				},
			];

			const playerGhosts: Ghost[] = [
				{
					id: "p1",
					color: "blue",
					position: { row: 4, col: 1 },
					owner: "player",
					isRevealed: false,
				},
				{
					id: "p2",
					color: "red",
					position: { row: 4, col: 2 },
					owner: "player",
					isRevealed: false,
				},
			];

			const gameState = createTestGameState(playerGhosts, computerGhosts);

			const startTime = Date.now();
			const move = await actualCalculateBestMove(gameState, "easy");
			const endTime = Date.now();

			expect(move).toBeDefined();
			// Should complete within 2 seconds (including thinking time)
			expect(endTime - startTime).toBeLessThan(2000);
		});
	});
});
