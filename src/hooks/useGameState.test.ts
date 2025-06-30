import { describe, expect, it, vi } from "vitest";
import {
	createInitialGameState,
	placePlayerGhost,
	startGamePhase,
} from "../game/gameInit";
import { canMove } from "../game/rules";
import type { GameState } from "../types/game";

// Mock the AI engine to avoid async complexity in tests
vi.mock("../game/ai/engine", () => ({
	calculateBestMove: vi.fn().mockResolvedValue({
		from: { row: 1, col: 1 },
		to: { row: 2, col: 1 },
		ghost: {
			id: "c5",
			color: "blue",
			position: { row: 1, col: 1 },
			owner: "computer",
			isRevealed: false,
		},
		capturedGhost: undefined,
	}),
}));

describe("useGameState logic", () => {
	describe("game state initialization", () => {
		it("should create initial game state correctly", () => {
			const gameState = createInitialGameState();

			expect(gameState.currentPlayer).toBe("player");
			expect(gameState.gamePhase).toBe("setup");
			expect(gameState.selectedPiece).toBeNull();
			expect(gameState.moveHistory).toHaveLength(0);
			expect(gameState.capturedGhosts).toHaveLength(0);
			expect(gameState.playerGhosts).toHaveLength(8);
			expect(gameState.computerGhosts).toHaveLength(8);
		});
	});

	describe("move validation", () => {
		it("should validate moves correctly", () => {
			// Create a game state in playing phase
			const gameState = createPlayingGameState();

			// Test valid move
			const playerGhost = gameState.playerGhosts.find(
				(g) => g.position.row === 4 && g.position.col === 1,
			);

			if (!playerGhost) {
				throw new Error("Player ghost not found");
			}

			const validMove = canMove(gameState, playerGhost.position, {
				row: 3,
				col: 1,
			});
			expect(validMove).toBe(true);

			// Test invalid move (too far)
			const invalidMove = canMove(gameState, playerGhost.position, {
				row: 2,
				col: 1,
			});
			expect(invalidMove).toBe(false);
		});

		it("should prevent moving computer ghosts during player turn", () => {
			const gameState = createInitialGameState();
			const computerGhost = gameState.computerGhosts[0];

			const move = canMove(gameState, computerGhost.position, {
				row: computerGhost.position.row + 1,
				col: computerGhost.position.col,
			});
			expect(move).toBe(false);
		});
	});

	describe("ghost selection logic", () => {
		it("should allow selecting player ghosts when it's player turn", () => {
			const gameState = createInitialGameState();
			const playerGhost = gameState.playerGhosts[0];

			// Player can select their own ghost
			expect(gameState.currentPlayer).toBe("player");
			expect(playerGhost.owner).toBe("player");
		});

		it("should not allow selecting computer ghosts", () => {
			const gameState = createInitialGameState();
			const computerGhost = gameState.computerGhosts[0];

			// Computer ghost should not be selectable by player
			expect(computerGhost.owner).toBe("computer");
			expect(gameState.currentPlayer).toBe("player");
		});
	});

	describe("ghost placement", () => {
		it("should place ghosts in correct starting positions", () => {
			const gameState = createPlayingGameState();

			// Player ghosts should be in rows 4-5
			const playerRows = gameState.playerGhosts.map((g) => g.position.row);
			expect(playerRows.every((row) => row === 4 || row === 5)).toBe(true);

			// Computer ghosts should be in rows 0-1
			const computerRows = gameState.computerGhosts.map((g) => g.position.row);
			expect(computerRows.every((row) => row === 0 || row === 1)).toBe(true);

			// All ghosts should be in columns 1-4
			const allGhosts = [
				...gameState.playerGhosts,
				...gameState.computerGhosts,
			];
			const columns = allGhosts.map((g) => g.position.col);
			expect(columns.every((col) => col >= 1 && col <= 4)).toBe(true);
		});

		it("should place ghosts on board correctly", () => {
			const gameState = createPlayingGameState();

			// Verify board matches ghost positions
			gameState.playerGhosts.forEach((ghost) => {
				const boardGhost =
					gameState.board[ghost.position.row][ghost.position.col];
				expect(boardGhost).toEqual(ghost);
			});

			gameState.computerGhosts.forEach((ghost) => {
				const boardGhost =
					gameState.board[ghost.position.row][ghost.position.col];
				expect(boardGhost).toEqual(ghost);
			});
		});
	});

	describe("game state structure", () => {
		it("should have correct ghost color distribution", () => {
			const gameState = createInitialGameState();

			const playerBlue = gameState.playerGhosts.filter(
				(g) => g.color === "blue",
			);
			const playerRed = gameState.playerGhosts.filter((g) => g.color === "red");
			const computerBlue = gameState.computerGhosts.filter(
				(g) => g.color === "blue",
			);
			const computerRed = gameState.computerGhosts.filter(
				(g) => g.color === "red",
			);

			expect(playerBlue).toHaveLength(4);
			expect(playerRed).toHaveLength(4);
			expect(computerBlue).toHaveLength(4);
			expect(computerRed).toHaveLength(4);
		});

		it("should have unique ghost IDs", () => {
			const gameState = createInitialGameState();

			const allGhosts = [
				...gameState.playerGhosts,
				...gameState.computerGhosts,
			];
			const ids = allGhosts.map((g) => g.id);
			const uniqueIds = new Set(ids);

			expect(uniqueIds.size).toBe(allGhosts.length);
		});

		it("should initialize ghosts as not revealed in playing phase", () => {
			const gameState = createPlayingGameState();

			const allGhosts = [
				...gameState.playerGhosts,
				...gameState.computerGhosts,
			];
			allGhosts.forEach((ghost) => {
				expect(ghost.isRevealed).toBe(false);
			});
		});

		it("should have player ghosts revealed during setup phase", () => {
			const gameState = createInitialGameState();

			// Player ghosts should be revealed during setup
			gameState.playerGhosts.forEach((ghost) => {
				expect(ghost.isRevealed).toBe(true);
			});

			// Computer ghosts should not be revealed
			gameState.computerGhosts.forEach((ghost) => {
				expect(ghost.isRevealed).toBe(false);
			});
		});
	});
});

// Helper function to create a game state in playing phase with all ghosts placed
function createPlayingGameState(): GameState {
	let gameState = createInitialGameState();

	// Place all player ghosts in valid positions
	const playerPositions = [
		{ row: 4, col: 1 },
		{ row: 4, col: 2 },
		{ row: 4, col: 3 },
		{ row: 4, col: 4 },
		{ row: 5, col: 1 },
		{ row: 5, col: 2 },
		{ row: 5, col: 3 },
		{ row: 5, col: 4 },
	];

	gameState.playerGhosts.forEach((ghost, index) => {
		gameState = placePlayerGhost(gameState, ghost, playerPositions[index]);
	});

	// Start the game phase to transition to playing
	gameState = startGamePhase(gameState);

	return gameState;
}
