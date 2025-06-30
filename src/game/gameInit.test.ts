import { describe, expect, it } from "vitest";
import type { GameState } from "../types/game";
import {
	createInitialGameState,
	placePlayerGhost,
	startGamePhase,
} from "./gameInit";

describe("gameInit", () => {
	describe("createInitialGameState", () => {
		it("should create game state with correct initial values", () => {
			const gameState = createInitialGameState();

			expect(gameState.currentPlayer).toBe("player");
			expect(gameState.gamePhase).toBe("setup");
			expect(gameState.selectedPiece).toBeNull();
			expect(gameState.moveHistory).toHaveLength(0);
			expect(gameState.capturedGhosts).toHaveLength(0);
		});

		it("should create 8 player ghosts with correct colors", () => {
			const gameState = createInitialGameState();

			expect(gameState.playerGhosts).toHaveLength(8);

			const blueGhosts = gameState.playerGhosts.filter(
				(g) => g.color === "blue",
			);
			const redGhosts = gameState.playerGhosts.filter((g) => g.color === "red");

			expect(blueGhosts).toHaveLength(4);
			expect(redGhosts).toHaveLength(4);
		});

		it("should create 8 computer ghosts with correct colors", () => {
			const gameState = createInitialGameState();

			expect(gameState.computerGhosts).toHaveLength(8);

			const blueGhosts = gameState.computerGhosts.filter(
				(g) => g.color === "blue",
			);
			const redGhosts = gameState.computerGhosts.filter(
				(g) => g.color === "red",
			);

			expect(blueGhosts).toHaveLength(4);
			expect(redGhosts).toHaveLength(4);
		});

		it("should have unplaced player ghosts in setup phase", () => {
			const gameState = createInitialGameState();

			// Player ghosts should have invalid positions in setup phase
			const playerRows = gameState.playerGhosts.map((g) => g.position.row);
			const allUnplaced = playerRows.every((row) => row === -1);

			expect(allUnplaced).toBe(true);
		});

		it("should place computer ghosts in rows 0-1", () => {
			const gameState = createInitialGameState();

			const computerRows = gameState.computerGhosts.map((g) => g.position.row);
			const validRows = computerRows.every((row) => row === 0 || row === 1);

			expect(validRows).toBe(true);
		});

		it("should place computer ghosts in columns 1-4", () => {
			const gameState = createInitialGameState();

			// Only check computer ghosts since player ghosts are unplaced
			const computerColumns = gameState.computerGhosts.map(
				(g) => g.position.col,
			);
			const validColumns = computerColumns.every((col) => col >= 1 && col <= 4);

			expect(validColumns).toBe(true);
		});

		it("should create board with only computer ghosts placed", () => {
			const gameState = createInitialGameState();

			// Only computer ghosts should be on the board in setup phase
			gameState.computerGhosts.forEach((ghost) => {
				const boardGhost =
					gameState.board[ghost.position.row][ghost.position.col];
				expect(boardGhost).toEqual(ghost);
			});

			// Player ghosts should not be on the board yet
			let playerGhostsOnBoard = 0;
			for (let row = 0; row < 6; row++) {
				for (let col = 0; col < 6; col++) {
					const cell = gameState.board[row][col];
					if (cell && cell.owner === "player") {
						playerGhostsOnBoard++;
					}
				}
			}
			expect(playerGhostsOnBoard).toBe(0);
		});

		it("should create board with empty cells in middle", () => {
			const gameState = createInitialGameState();

			// Rows 2-3 should be empty
			for (let row = 2; row <= 3; row++) {
				for (let col = 0; col < 6; col++) {
					expect(gameState.board[row][col]).toBeNull();
				}
			}

			// Columns 0 and 5 should be empty except escape squares
			for (let row = 0; row < 6; row++) {
				expect(gameState.board[row][0]).toBeNull();
				expect(gameState.board[row][5]).toBeNull();
			}
		});

		it("should create ghosts with unique IDs", () => {
			const gameState = createInitialGameState();

			const allGhosts = [
				...gameState.playerGhosts,
				...gameState.computerGhosts,
			];
			const ids = allGhosts.map((g) => g.id);
			const uniqueIds = new Set(ids);

			expect(uniqueIds.size).toBe(allGhosts.length);
		});

		it("should create ghosts with correct owners", () => {
			const gameState = createInitialGameState();

			gameState.playerGhosts.forEach((ghost) => {
				expect(ghost.owner).toBe("player");
			});

			gameState.computerGhosts.forEach((ghost) => {
				expect(ghost.owner).toBe("computer");
			});
		});

		it("should have player ghosts revealed in setup phase", () => {
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

	describe("playing phase transition", () => {
		it("should place player ghosts in rows 4-5 after setup", () => {
			const gameState = createPlayingGameState();

			const playerRows = gameState.playerGhosts.map((g) => g.position.row);
			const validRows = playerRows.every((row) => row === 4 || row === 5);

			expect(validRows).toBe(true);
		});

		it("should hide player ghosts after setup", () => {
			const gameState = createPlayingGameState();

			// All ghosts should be hidden in playing phase
			const allGhosts = [
				...gameState.playerGhosts,
				...gameState.computerGhosts,
			];
			allGhosts.forEach((ghost) => {
				expect(ghost.isRevealed).toBe(false);
			});
		});

		it("should have all ghosts on board in playing phase", () => {
			const gameState = createPlayingGameState();

			// All ghosts should be on the board
			const allGhosts = [
				...gameState.playerGhosts,
				...gameState.computerGhosts,
			];
			allGhosts.forEach((ghost) => {
				const boardGhost =
					gameState.board[ghost.position.row][ghost.position.col];
				expect(boardGhost).toEqual(ghost);
			});
		});
	});
});

// Helper function to create a game state in playing phase
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
