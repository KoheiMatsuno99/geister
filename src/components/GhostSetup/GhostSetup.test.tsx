import { describe, expect, it, vi } from "vitest";
import {
	areAllPlayerGhostsPlaced,
	createInitialGameState,
	isValidPlayerPlacement,
	placePlayerGhost,
} from "../../game/gameInit";

// Mock the image imports
vi.mock("../../assets/blueGhost.jpeg", () => ({
	default: "mocked-blue-ghost.jpg",
}));
vi.mock("../../assets/redGhost.jpeg", () => ({
	default: "mocked-red-ghost.jpg",
}));
vi.mock("../../assets/unknownGhost.jpeg", () => ({
	default: "mocked-unknown-ghost.jpg",
}));

describe("GhostSetup Logic", () => {
	describe("initial game state for setup", () => {
		it("should create game state in setup phase", () => {
			const gameState = createInitialGameState();

			expect(gameState.gamePhase).toBe("setup");
			expect(gameState.currentPlayer).toBe("player");
		});

		it("should have 8 unplaced player ghosts initially", () => {
			const gameState = createInitialGameState();

			const unplacedGhosts = gameState.playerGhosts.filter(
				(ghost) => ghost.position.row < 0,
			);
			expect(unplacedGhosts).toHaveLength(8);
		});

		it("should have computer ghosts placed randomly", () => {
			const gameState = createInitialGameState();

			const placedComputerGhosts = gameState.computerGhosts.filter(
				(ghost) => ghost.position.row >= 0 && ghost.position.col >= 0,
			);
			expect(placedComputerGhosts).toHaveLength(8);

			// All computer ghosts should be in rows 0-1
			placedComputerGhosts.forEach((ghost) => {
				expect(ghost.position.row >= 0 && ghost.position.row <= 1).toBe(true);
				expect(ghost.position.col >= 1 && ghost.position.col <= 4).toBe(true);
			});
		});
	});

	describe("ghost placement validation", () => {
		it("should validate valid player placement positions", () => {
			// Valid positions: rows 4-5, cols 1-4
			expect(isValidPlayerPlacement({ row: 4, col: 1 })).toBe(true);
			expect(isValidPlayerPlacement({ row: 4, col: 4 })).toBe(true);
			expect(isValidPlayerPlacement({ row: 5, col: 1 })).toBe(true);
			expect(isValidPlayerPlacement({ row: 5, col: 4 })).toBe(true);
		});

		it("should reject invalid player placement positions", () => {
			// Invalid positions
			expect(isValidPlayerPlacement({ row: 0, col: 0 })).toBe(false); // Corner
			expect(isValidPlayerPlacement({ row: 1, col: 1 })).toBe(false); // Computer area
			expect(isValidPlayerPlacement({ row: 3, col: 3 })).toBe(false); // Middle area
			expect(isValidPlayerPlacement({ row: 4, col: 0 })).toBe(false); // Goal column
			expect(isValidPlayerPlacement({ row: 4, col: 5 })).toBe(false); // Goal column
		});

		it("should place ghost correctly when position is valid", () => {
			const gameState = createInitialGameState();
			const ghost = gameState.playerGhosts[0];
			const position = { row: 4, col: 1 };

			const newGameState = placePlayerGhost(gameState, ghost, position);

			expect(newGameState.board[4][1]).toEqual({
				...ghost,
				position: { row: 4, col: 1 },
			});
		});

		it("should detect when all player ghosts are placed", () => {
			const gameState = createInitialGameState();
			// Initially no ghosts are placed
			expect(areAllPlayerGhostsPlaced(gameState.playerGhosts)).toBe(false);

			// Simulate all ghosts placed
			const placedGhosts = gameState.playerGhosts.map((ghost, index) => ({
				...ghost,
				position: {
					row: 4 + Math.floor(index / 4),
					col: 1 + (index % 4),
				},
			}));

			expect(areAllPlayerGhostsPlaced(placedGhosts)).toBe(true);
		});
	});
});
