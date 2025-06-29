import { describe, expect, it } from "vitest";
import type { GameState, Ghost, Position } from "../types/game";
import {
	BOARD_SIZE,
	canMove,
	checkWinCondition,
	executeMove,
	isEscapeSquare,
	isValidPosition,
} from "./rules";

describe("Game Rules", () => {
	describe("isValidPosition", () => {
		it("should return true for valid positions", () => {
			expect(isValidPosition({ row: 0, col: 0 })).toBe(true);
			expect(isValidPosition({ row: 2, col: 3 })).toBe(true);
			expect(isValidPosition({ row: 5, col: 5 })).toBe(true);
		});

		it("should return false for invalid positions", () => {
			expect(isValidPosition({ row: -1, col: 0 })).toBe(false);
			expect(isValidPosition({ row: 0, col: -1 })).toBe(false);
			expect(isValidPosition({ row: 6, col: 0 })).toBe(false);
			expect(isValidPosition({ row: 0, col: 6 })).toBe(false);
		});
	});

	describe("isEscapeSquare", () => {
		it("should identify player escape squares correctly", () => {
			expect(isEscapeSquare({ row: 0, col: 0 }, "player")).toBe(true);
			expect(isEscapeSquare({ row: 0, col: 5 }, "player")).toBe(true);
			expect(isEscapeSquare({ row: 0, col: 2 }, "player")).toBe(false);
			expect(isEscapeSquare({ row: 1, col: 0 }, "player")).toBe(false);
		});

		it("should identify computer escape squares correctly", () => {
			expect(isEscapeSquare({ row: 5, col: 0 }, "computer")).toBe(true);
			expect(isEscapeSquare({ row: 5, col: 5 }, "computer")).toBe(true);
			expect(isEscapeSquare({ row: 5, col: 2 }, "computer")).toBe(false);
			expect(isEscapeSquare({ row: 4, col: 0 }, "computer")).toBe(false);
		});
	});

	describe("canMove", () => {
		const createTestGameState = (): GameState => {
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
				position: { row: 3, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			const board = Array(BOARD_SIZE)
				.fill(null)
				.map(() => Array(BOARD_SIZE).fill(null));
			board[2][2] = playerGhost;
			board[3][2] = computerGhost;

			return {
				board,
				currentPlayer: "player",
				gamePhase: "playing",
				selectedPiece: null,
				moveHistory: [],
				playerGhosts: [playerGhost],
				computerGhosts: [computerGhost],
				capturedGhosts: [],
			};
		};

		it("should allow valid adjacent moves", () => {
			const gameState = createTestGameState();
			const from: Position = { row: 2, col: 2 };

			expect(canMove(gameState, from, { row: 1, col: 2 })).toBe(true); // up
			expect(canMove(gameState, from, { row: 2, col: 1 })).toBe(true); // left
			expect(canMove(gameState, from, { row: 2, col: 3 })).toBe(true); // right
		});

		it("should not allow moving to same color piece", () => {
			const gameState = createTestGameState();
			const playerGhost2: Ghost = {
				id: "p2",
				color: "red",
				position: { row: 1, col: 2 },
				owner: "player",
				isRevealed: false,
			};
			gameState.board[1][2] = playerGhost2;
			gameState.playerGhosts.push(playerGhost2);

			const from: Position = { row: 2, col: 2 };
			expect(canMove(gameState, from, { row: 1, col: 2 })).toBe(false);
		});

		it("should allow capturing opponent pieces", () => {
			const gameState = createTestGameState();
			const from: Position = { row: 2, col: 2 };
			const to: Position = { row: 3, col: 2 }; // computer ghost position

			expect(canMove(gameState, from, to)).toBe(true);
		});

		it("should not allow diagonal moves", () => {
			const gameState = createTestGameState();
			const from: Position = { row: 2, col: 2 };

			expect(canMove(gameState, from, { row: 1, col: 1 })).toBe(false);
			expect(canMove(gameState, from, { row: 3, col: 3 })).toBe(false);
		});

		it("should not allow moves more than one square", () => {
			const gameState = createTestGameState();
			const from: Position = { row: 2, col: 2 };

			expect(canMove(gameState, from, { row: 0, col: 2 })).toBe(false);
			expect(canMove(gameState, from, { row: 2, col: 4 })).toBe(false);
		});
	});

	describe("executeMove", () => {
		it("should move ghost to new position", () => {
			const gameState = createTestGameState();
			const move = {
				from: { row: 2, col: 2 },
				to: { row: 1, col: 2 },
				ghost: gameState.playerGhosts[0],
			};

			const newGameState = executeMove(gameState, move);

			expect(newGameState.board[1][2]).toEqual({
				...move.ghost,
				position: { row: 1, col: 2 },
			});
			expect(newGameState.board[2][2]).toBeNull();
			expect(newGameState.currentPlayer).toBe("computer");
		});

		it("should capture opponent ghost", () => {
			const gameState = createTestGameState();
			const capturedGhost = gameState.computerGhosts[0];
			const move = {
				from: { row: 2, col: 2 },
				to: { row: 3, col: 2 },
				ghost: gameState.playerGhosts[0],
				capturedGhost,
			};

			const newGameState = executeMove(gameState, move);

			expect(newGameState.capturedGhosts).toContain(capturedGhost);
			expect(newGameState.board[3][2]).toEqual({
				...move.ghost,
				position: { row: 3, col: 2 },
			});
		});
	});

	describe("checkWinCondition", () => {
		it("should detect win by capturing all blue ghosts", () => {
			const gameState = createTestGameState();
			// Set computer to have captured all player blue ghosts
			gameState.playerGhosts[0].color = "blue";
			gameState.capturedGhosts = [gameState.playerGhosts[0]];

			const result = checkWinCondition(gameState);
			expect(result.winner).toBe("computer");
			expect(result.condition).toBe("capture_all_blue");
		});

		it("should detect win by losing all red ghosts", () => {
			const gameState = createTestGameState();
			// Add blue ghosts to both players to prevent blue capture win condition
			const playerBlueGhost: Ghost = {
				id: "p2",
				color: "blue",
				position: { row: 3, col: 3 },
				owner: "player",
				isRevealed: false,
			};
			const computerBlueGhost: Ghost = {
				id: "c2",
				color: "blue",
				position: { row: 2, col: 3 },
				owner: "computer",
				isRevealed: false,
			};

			gameState.playerGhosts.push(playerBlueGhost);
			gameState.computerGhosts.push(computerBlueGhost);
			gameState.board[3][3] = playerBlueGhost;
			gameState.board[2][3] = computerBlueGhost;

			// Set existing ghost as red and capture it
			gameState.playerGhosts[0].color = "red";
			gameState.capturedGhosts = [gameState.playerGhosts[0]];

			const result = checkWinCondition(gameState);
			expect(result.winner).toBe("player");
			expect(result.condition).toBe("lose_all_red");
		});

		it("should detect win by escape", () => {
			const gameState = createTestGameState();
			// Set blue ghost at escape square
			gameState.playerGhosts[0].color = "blue";
			gameState.playerGhosts[0].position = { row: 0, col: 0 };

			const result = checkWinCondition(gameState);
			expect(result.winner).toBe("player");
			expect(result.condition).toBe("escape");
		});
	});

	describe("executeMove with capture", () => {
		it("should capture opponent ghost and update ghost arrays", () => {
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
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			const board = Array(BOARD_SIZE)
				.fill(null)
				.map(() => Array(BOARD_SIZE).fill(null));
			board[2][2] = playerGhost;
			board[1][2] = computerGhost;

			const gameState: GameState = {
				board,
				currentPlayer: "player",
				gamePhase: "playing",
				selectedPiece: null,
				moveHistory: [],
				playerGhosts: [playerGhost],
				computerGhosts: [computerGhost],
				capturedGhosts: [],
			};

			const move = {
				from: { row: 2, col: 2 },
				to: { row: 1, col: 2 },
				ghost: { ...playerGhost, isRevealed: true },
				capturedGhost: { ...computerGhost, isRevealed: true },
			};

			const newGameState = executeMove(gameState, move);

			// Check that the computer ghost was captured
			expect(newGameState.capturedGhosts).toHaveLength(1);
			expect(newGameState.capturedGhosts[0].id).toBe("c1");
			expect(newGameState.capturedGhosts[0].isRevealed).toBe(true);

			// Check that the player ghost moved and was revealed
			expect(newGameState.board[1][2]).toEqual({
				...playerGhost,
				position: { row: 1, col: 2 },
				isRevealed: true,
			});
			expect(newGameState.board[2][2]).toBeNull();

			// Check that the player ghost in the playerGhosts array was updated
			expect(newGameState.playerGhosts[0].position).toEqual({ row: 1, col: 2 });
			expect(newGameState.playerGhosts[0].isRevealed).toBe(true);

			// Check that the computer ghost array is unchanged (captured ghosts remain in original arrays)
			expect(newGameState.computerGhosts).toHaveLength(1);
			expect(newGameState.computerGhosts[0].id).toBe("c1");
		});

		it("should update ghost arrays when computer captures player ghost", () => {
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
				position: { row: 3, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			const board = Array(BOARD_SIZE)
				.fill(null)
				.map(() => Array(BOARD_SIZE).fill(null));
			board[2][2] = playerGhost;
			board[3][2] = computerGhost;

			const gameState: GameState = {
				board,
				currentPlayer: "computer",
				gamePhase: "playing",
				selectedPiece: null,
				moveHistory: [],
				playerGhosts: [playerGhost],
				computerGhosts: [computerGhost],
				capturedGhosts: [],
			};

			const move = {
				from: { row: 3, col: 2 },
				to: { row: 2, col: 2 },
				ghost: { ...computerGhost, isRevealed: true },
				capturedGhost: { ...playerGhost, isRevealed: true },
			};

			const newGameState = executeMove(gameState, move);

			// Check that the player ghost was captured
			expect(newGameState.capturedGhosts).toHaveLength(1);
			expect(newGameState.capturedGhosts[0].id).toBe("p1");
			expect(newGameState.capturedGhosts[0].isRevealed).toBe(true);

			// Check that the computer ghost moved and was revealed
			expect(newGameState.board[2][2]).toEqual({
				...computerGhost,
				position: { row: 2, col: 2 },
				isRevealed: true,
			});
			expect(newGameState.board[3][2]).toBeNull();

			// Check that the computer ghost in the computerGhosts array was updated
			expect(newGameState.computerGhosts[0].position).toEqual({
				row: 2,
				col: 2,
			});
			expect(newGameState.computerGhosts[0].isRevealed).toBe(true);

			// Check that the player ghost array is unchanged (captured ghosts remain in original arrays)
			expect(newGameState.playerGhosts).toHaveLength(1);
			expect(newGameState.playerGhosts[0].id).toBe("p1");
		});
	});
});

function createTestGameState(): GameState {
	const playerGhost: Ghost = {
		id: "p1",
		color: "blue",
		position: { row: 4, col: 2 },
		owner: "player",
		isRevealed: false,
	};

	const computerGhost: Ghost = {
		id: "c1",
		color: "red",
		position: { row: 1, col: 2 },
		owner: "computer",
		isRevealed: false,
	};

	const board = Array(BOARD_SIZE)
		.fill(null)
		.map(() => Array(BOARD_SIZE).fill(null));
	board[4][2] = playerGhost;
	board[1][2] = computerGhost;

	return {
		board,
		currentPlayer: "player",
		gamePhase: "playing",
		selectedPiece: null,
		moveHistory: [],
		playerGhosts: [playerGhost],
		computerGhosts: [computerGhost],
		capturedGhosts: [],
	};
}
