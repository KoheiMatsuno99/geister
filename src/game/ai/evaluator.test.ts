import { describe, expect, it } from "vitest";
import type { GameState, Ghost } from "../../types/game";
import { BOARD_SIZE } from "../rules";
import { evaluatePosition } from "./evaluator";

describe("AI Evaluator", () => {
	function createBaseGameState(): GameState {
		const board = Array(BOARD_SIZE)
			.fill(null)
			.map(() => Array(BOARD_SIZE).fill(null));

		return {
			board,
			currentPlayer: "player",
			gamePhase: "playing",
			selectedPiece: null,
			moveHistory: [],
			playerGhosts: [],
			computerGhosts: [],
			capturedGhosts: [],
		};
	}

	describe("evaluatePosition", () => {
		it("should return high positive score for computer winning position", () => {
			const gameState = createBaseGameState();

			// Computer captures all player blue ghosts
			const playerRedGhost: Ghost = {
				id: "p1",
				color: "red",
				position: { row: 4, col: 2 },
				owner: "player",
				isRevealed: false,
			};
			const playerBlueGhost: Ghost = {
				id: "p2",
				color: "blue",
				position: { row: 4, col: 3 },
				owner: "player",
				isRevealed: true,
			};
			const computerBlueGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			gameState.playerGhosts = [playerRedGhost, playerBlueGhost];
			gameState.computerGhosts = [computerBlueGhost];
			gameState.capturedGhosts = [playerBlueGhost]; // Player blue captured

			const score = evaluatePosition(gameState, "computer");
			expect(score).toBe(1000); // Win condition
		});

		it("should return high negative score for computer losing position", () => {
			const gameState = createBaseGameState();

			// Player captures all computer blue ghosts
			const playerBlueGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 4, col: 2 },
				owner: "player",
				isRevealed: false,
			};
			const computerBlueGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: true,
			};

			gameState.playerGhosts = [playerBlueGhost];
			gameState.computerGhosts = [computerBlueGhost];
			gameState.capturedGhosts = [computerBlueGhost]; // Computer blue captured

			const score = evaluatePosition(gameState, "computer");
			expect(score).toBe(-1000); // Lose condition
		});

		it("should favor having more blue ghosts", () => {
			const gameState = createBaseGameState();

			// Computer has 2 blue, player has 1 blue
			const playerBlueGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 4, col: 2 },
				owner: "player",
				isRevealed: false,
			};
			const playerRedGhost: Ghost = {
				id: "p2",
				color: "red",
				position: { row: 4, col: 3 },
				owner: "player",
				isRevealed: false,
			};
			const computerBlueGhost1: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: false,
			};
			const computerBlueGhost2: Ghost = {
				id: "c2",
				color: "blue",
				position: { row: 1, col: 3 },
				owner: "computer",
				isRevealed: false,
			};

			gameState.playerGhosts = [playerBlueGhost, playerRedGhost];
			gameState.computerGhosts = [computerBlueGhost1, computerBlueGhost2];

			const score = evaluatePosition(gameState, "computer");
			// Should be positive because computer has more blue ghosts
			expect(score).toBeGreaterThan(0);
		});

		it("should reward blue ghosts close to escape squares", () => {
			const gameState1 = createBaseGameState();
			const gameState2 = createBaseGameState();

			// Add balanced ghosts to prevent win conditions
			const playerBlueGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 0, col: 2 },
				owner: "player",
				isRevealed: false,
			};
			const playerRedGhost: Ghost = {
				id: "p2",
				color: "red",
				position: { row: 4, col: 1 },
				owner: "player",
				isRevealed: false,
			};
			const computerRedGhost: Ghost = {
				id: "c1",
				color: "red",
				position: { row: 1, col: 1 },
				owner: "computer",
				isRevealed: false,
			};

			// Blue ghost far from escape
			const farBlueGhost: Ghost = {
				id: "c2",
				color: "blue",
				position: { row: 2, col: 2 }, // Middle of board
				owner: "computer",
				isRevealed: false,
			};

			// Blue ghost close to escape (but not at escape square)
			const nearBlueGhost: Ghost = {
				id: "c2",
				color: "blue",
				position: { row: 4, col: 1 }, // Closer to escape corner
				owner: "computer",
				isRevealed: false,
			};

			gameState1.playerGhosts = [playerBlueGhost, playerRedGhost];
			gameState1.computerGhosts = [computerRedGhost, farBlueGhost];

			gameState2.playerGhosts = [playerBlueGhost, playerRedGhost];
			gameState2.computerGhosts = [computerRedGhost, nearBlueGhost];

			const score1 = evaluatePosition(gameState1, "computer");
			const score2 = evaluatePosition(gameState2, "computer");

			expect(score2).toBeGreaterThan(score1);
		});

		it("should heavily reward immediate escape threats", () => {
			const gameState = createBaseGameState();

			// Add balanced setup to prevent win conditions
			const playerBlueGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 0, col: 2 },
				owner: "player",
				isRevealed: false,
			};
			const playerRedGhost: Ghost = {
				id: "p2",
				color: "red",
				position: { row: 4, col: 2 },
				owner: "player",
				isRevealed: false,
			};
			const computerRedGhost: Ghost = {
				id: "c1",
				color: "red",
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			// Blue ghost one move away from escape
			const escapeGhost: Ghost = {
				id: "c2",
				color: "blue",
				position: { row: 4, col: 0 }, // One move from escape (5,0)
				owner: "computer",
				isRevealed: false,
			};

			gameState.playerGhosts = [playerBlueGhost, playerRedGhost];
			gameState.computerGhosts = [computerRedGhost, escapeGhost];

			const score = evaluatePosition(gameState, "computer");
			// Should be high due to escape threat bonus (100 points)
			expect(score).toBeGreaterThan(120);
		});

		it("should be symmetric for different players", () => {
			const gameState = createBaseGameState();

			const playerBlueGhost: Ghost = {
				id: "p1",
				color: "blue",
				position: { row: 4, col: 2 },
				owner: "player",
				isRevealed: false,
			};
			const computerBlueGhost: Ghost = {
				id: "c1",
				color: "blue",
				position: { row: 1, col: 2 },
				owner: "computer",
				isRevealed: false,
			};

			gameState.playerGhosts = [playerBlueGhost];
			gameState.computerGhosts = [computerBlueGhost];

			const playerScore = evaluatePosition(gameState, "player");
			const computerScore = evaluatePosition(gameState, "computer");

			// Scores should be roughly opposite (allowing for small positional differences)
			expect(Math.abs(playerScore + computerScore)).toBeLessThan(50);
		});
	});
});
