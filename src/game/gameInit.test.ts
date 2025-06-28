import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./gameInit";

describe("gameInit", () => {
	describe("createInitialGameState", () => {
		it("should create game state with correct initial values", () => {
			const gameState = createInitialGameState();

			expect(gameState.currentPlayer).toBe("player");
			expect(gameState.gamePhase).toBe("playing");
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

		it("should place player ghosts in rows 4-5", () => {
			const gameState = createInitialGameState();

			const playerRows = gameState.playerGhosts.map((g) => g.position.row);
			const validRows = playerRows.every((row) => row === 4 || row === 5);

			expect(validRows).toBe(true);
		});

		it("should place computer ghosts in rows 0-1", () => {
			const gameState = createInitialGameState();

			const computerRows = gameState.computerGhosts.map((g) => g.position.row);
			const validRows = computerRows.every((row) => row === 0 || row === 1);

			expect(validRows).toBe(true);
		});

		it("should place ghosts in columns 1-4", () => {
			const gameState = createInitialGameState();

			const allGhosts = [
				...gameState.playerGhosts,
				...gameState.computerGhosts,
			];
			const columns = allGhosts.map((g) => g.position.col);
			const validColumns = columns.every((col) => col >= 1 && col <= 4);

			expect(validColumns).toBe(true);
		});

		it("should create board with ghosts placed correctly", () => {
			const gameState = createInitialGameState();

			// Check that all ghost positions match board state
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

		it("should create ghosts that are not revealed initially", () => {
			const gameState = createInitialGameState();

			const allGhosts = [
				...gameState.playerGhosts,
				...gameState.computerGhosts,
			];
			allGhosts.forEach((ghost) => {
				expect(ghost.isRevealed).toBe(false);
			});
		});
	});
});
