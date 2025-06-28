import { describe, expect, it } from "vitest";
import type { GameState, Ghost } from "../../types/game";
import { BOARD_SIZE } from "../rules";
import { generatePossibleMoves } from "./moveGenerator";

describe("Move Generator", () => {
	const createTestGameState = (ghosts: Ghost[]): GameState => {
		const board = Array(BOARD_SIZE)
			.fill(null)
			.map(() => Array(BOARD_SIZE).fill(null));

		// Place ghosts on board
		for (const ghost of ghosts) {
			board[ghost.position.row][ghost.position.col] = ghost;
		}

		const playerGhosts = ghosts.filter((g) => g.owner === "player");
		const computerGhosts = ghosts.filter((g) => g.owner === "computer");

		return {
			board,
			currentPlayer: "player",
			gamePhase: "playing",
			selectedPiece: null,
			moveHistory: [],
			playerGhosts,
			computerGhosts,
			capturedGhosts: [],
		};
	};

	describe("generatePossibleMoves", () => {
		it("should generate all possible moves for single ghost", () => {
			const ghost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 }, // center position
				owner: "player",
				isRevealed: false,
			};

			const gameState = createTestGameState([ghost]);
			const moves = generatePossibleMoves(gameState);

			// Should have 4 moves (up, down, left, right)
			expect(moves).toHaveLength(4);

			const destinations = moves.map((move) => move.to);
			expect(destinations).toContainEqual({ row: 1, col: 2 }); // up
			expect(destinations).toContainEqual({ row: 3, col: 2 }); // down
			expect(destinations).toContainEqual({ row: 2, col: 1 }); // left
			expect(destinations).toContainEqual({ row: 2, col: 3 }); // right
		});

		it("should generate moves for corner ghost with limited options", () => {
			const ghost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 0, col: 0 }, // top-left corner
				owner: "player",
				isRevealed: false,
			};

			const gameState = createTestGameState([ghost]);
			const moves = generatePossibleMoves(gameState);

			// Should have 2 moves (down, right)
			expect(moves).toHaveLength(2);

			const destinations = moves.map((move) => move.to);
			expect(destinations).toContainEqual({ row: 1, col: 0 }); // down
			expect(destinations).toContainEqual({ row: 0, col: 1 }); // right
		});

		it("should not generate moves to squares occupied by same player", () => {
			const ghosts: Ghost[] = [
				{
					id: "p1",
					color: "blue",
					position: { row: 2, col: 2 },
					owner: "player",
					isRevealed: false,
				},
				{
					id: "p2",
					color: "red",
					position: { row: 1, col: 2 }, // adjacent to p1
					owner: "player",
					isRevealed: false,
				},
			];

			const gameState = createTestGameState(ghosts);
			const moves = generatePossibleMoves(gameState);

			// Should have moves for both ghosts, but p1 can't move up
			const p1Moves = moves.filter((move) => move.ghost.id === "p1");
			const p1Destinations = p1Moves.map((move) => move.to);

			expect(p1Destinations).not.toContainEqual({ row: 1, col: 2 }); // blocked
			expect(p1Destinations).toContainEqual({ row: 3, col: 2 }); // down ok
			expect(p1Destinations).toContainEqual({ row: 2, col: 1 }); // left ok
			expect(p1Destinations).toContainEqual({ row: 2, col: 3 }); // right ok
		});

		it("should generate capture moves for opponent ghosts", () => {
			const ghosts: Ghost[] = [
				{
					id: "p1",
					color: "blue",
					position: { row: 2, col: 2 },
					owner: "player",
					isRevealed: false,
				},
				{
					id: "c1",
					color: "red",
					position: { row: 1, col: 2 }, // adjacent opponent
					owner: "computer",
					isRevealed: false,
				},
			];

			const gameState = createTestGameState(ghosts);
			const moves = generatePossibleMoves(gameState);

			const captureMoves = moves.filter((move) => move.capturedGhost);
			expect(captureMoves).toHaveLength(1);

			const captureMove = captureMoves[0];
			expect(captureMove.from).toEqual({ row: 2, col: 2 });
			expect(captureMove.to).toEqual({ row: 1, col: 2 });
			expect(captureMove.capturedGhost?.id).toBe("c1");
		});

		it("should only generate moves for current player", () => {
			const ghosts: Ghost[] = [
				{
					id: "p1",
					color: "blue",
					position: { row: 2, col: 2 },
					owner: "player",
					isRevealed: false,
				},
				{
					id: "c1",
					color: "red",
					position: { row: 3, col: 3 },
					owner: "computer",
					isRevealed: false,
				},
			];

			const gameState = createTestGameState(ghosts);
			gameState.currentPlayer = "player";

			const moves = generatePossibleMoves(gameState);

			// All moves should be from player ghosts
			for (const move of moves) {
				expect(move.ghost.owner).toBe("player");
			}
		});

		it("should handle computer player turn", () => {
			const ghosts: Ghost[] = [
				{
					id: "p1",
					color: "blue",
					position: { row: 2, col: 2 },
					owner: "player",
					isRevealed: false,
				},
				{
					id: "c1",
					color: "red",
					position: { row: 3, col: 3 },
					owner: "computer",
					isRevealed: false,
				},
			];

			const gameState = createTestGameState(ghosts);
			gameState.currentPlayer = "computer";

			const moves = generatePossibleMoves(gameState);

			// All moves should be from computer ghosts
			for (const move of moves) {
				expect(move.ghost.owner).toBe("computer");
			}

			expect(moves.length).toBeGreaterThan(0);
		});

		it("should not generate moves for captured ghosts", () => {
			const playerGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const capturedGhost: Ghost = {
				id: "p2",
				color: "red",
				position: { row: 3, col: 3 },
				owner: "player",
				isRevealed: true,
			};

			const gameState = createTestGameState([playerGhost, capturedGhost]);
			gameState.capturedGhosts = [capturedGhost];

			const moves = generatePossibleMoves(gameState);

			// Should only have moves for non-captured ghost
			const ghostIds = moves.map((move) => move.ghost.id);
			expect(ghostIds).toContain("p1");
			expect(ghostIds).not.toContain("p2");
		});

		it("should return empty array when no moves available", () => {
			// Surrounded ghost scenario
			const ghosts: Ghost[] = [
				{
					id: "p1",
					color: "blue",
					position: { row: 2, col: 2 },
					owner: "player",
					isRevealed: false,
				},
				// Surround with player's own ghosts
				{
					id: "p2",
					color: "red",
					position: { row: 1, col: 2 },
					owner: "player",
					isRevealed: false,
				},
				{
					id: "p3",
					color: "red",
					position: { row: 3, col: 2 },
					owner: "player",
					isRevealed: false,
				},
				{
					id: "p4",
					color: "red",
					position: { row: 2, col: 1 },
					owner: "player",
					isRevealed: false,
				},
				{
					id: "p5",
					color: "red",
					position: { row: 2, col: 3 },
					owner: "player",
					isRevealed: false,
				},
			];

			const gameState = createTestGameState(ghosts);
			// Capture the movable ghosts
			gameState.capturedGhosts = [ghosts[1], ghosts[2], ghosts[3], ghosts[4]];

			const moves = generatePossibleMoves(gameState);
			expect(moves).toHaveLength(0);
		});

		it("should generate correct move objects", () => {
			const ghost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 2, col: 2 },
				owner: "player",
				isRevealed: false,
			};

			const gameState = createTestGameState([ghost]);
			const moves = generatePossibleMoves(gameState);

			for (const move of moves) {
				expect(move.from).toEqual({ row: 2, col: 2 });
				expect(move.ghost).toEqual(ghost);
				expect(move.capturedGhost).toBeUndefined();

				// Verify destination is adjacent
				const deltaRow = Math.abs(move.to.row - move.from.row);
				const deltaCol = Math.abs(move.to.col - move.from.col);
				expect(
					(deltaRow === 1 && deltaCol === 0) ||
						(deltaRow === 0 && deltaCol === 1),
				).toBe(true);
			}
		});
	});
});
