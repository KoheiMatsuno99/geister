import type { GameState, Ghost } from "../types/game";
import { BOARD_SIZE } from "./rules";

/**
 * Creates the initial game state for the setup phase.
 * Player ghosts are not placed on board yet, computer ghosts are randomly placed.
 */
export const createInitialGameState = (): GameState => {
	const playerGhosts = createUnplacedPlayerGhosts();
	const computerGhosts = createRandomComputerGhosts();
	const board = createInitialBoard([], computerGhosts);

	return {
		board,
		currentPlayer: "player",
		gamePhase: "setup",
		selectedPiece: null,
		moveHistory: [],
		playerGhosts,
		computerGhosts,
		capturedGhosts: [],
	};
};

const createUnplacedPlayerGhosts = (): Ghost[] => [
	{
		id: "p1",
		color: "blue",
		position: { row: -1, col: -1 }, // Not placed yet
		owner: "player",
		isRevealed: true, // Revealed during setup
	},
	{
		id: "p2",
		color: "blue",
		position: { row: -1, col: -1 },
		owner: "player",
		isRevealed: true,
	},
	{
		id: "p3",
		color: "red",
		position: { row: -1, col: -1 },
		owner: "player",
		isRevealed: true,
	},
	{
		id: "p4",
		color: "red",
		position: { row: -1, col: -1 },
		owner: "player",
		isRevealed: true,
	},
	{
		id: "p5",
		color: "blue",
		position: { row: -1, col: -1 },
		owner: "player",
		isRevealed: true,
	},
	{
		id: "p6",
		color: "blue",
		position: { row: -1, col: -1 },
		owner: "player",
		isRevealed: true,
	},
	{
		id: "p7",
		color: "red",
		position: { row: -1, col: -1 },
		owner: "player",
		isRevealed: true,
	},
	{
		id: "p8",
		color: "red",
		position: { row: -1, col: -1 },
		owner: "player",
		isRevealed: true,
	},
];

const createRandomComputerGhosts = (): Ghost[] => {
	// Define ghost colors and IDs
	const ghostConfigs = [
		{ id: "c1", color: "blue" },
		{ id: "c2", color: "blue" },
		{ id: "c3", color: "red" },
		{ id: "c4", color: "red" },
		{ id: "c5", color: "blue" },
		{ id: "c6", color: "blue" },
		{ id: "c7", color: "red" },
		{ id: "c8", color: "red" },
	] as const;

	// Get all valid computer positions (rows 0-1, cols 1-4)
	const validPositions = [];
	for (let row = 0; row <= 1; row++) {
		for (let col = 1; col <= 4; col++) {
			validPositions.push({ row, col });
		}
	}

	// Shuffle positions randomly
	const shuffledPositions = validPositions.sort(() => Math.random() - 0.5);

	// Create ghosts with random positions
	return ghostConfigs.map((config, index) => ({
		id: config.id,
		color: config.color,
		position: shuffledPositions[index],
		owner: "computer" as const,
		isRevealed: false,
	}));
};

const createInitialBoard = (playerGhosts: Ghost[], computerGhosts: Ghost[]) => {
	const board = Array(BOARD_SIZE)
		.fill(null)
		.map(() => Array(BOARD_SIZE).fill(null));

	[...playerGhosts, ...computerGhosts].forEach((ghost) => {
		// Only place ghosts that have valid positions
		if (ghost.position.row >= 0 && ghost.position.col >= 0) {
			board[ghost.position.row][ghost.position.col] = ghost;
		}
	});

	return board;
};

/**
 * Checks if all player ghosts are placed on the board.
 */
export const areAllPlayerGhostsPlaced = (playerGhosts: Ghost[]): boolean => {
	return playerGhosts.every(
		(ghost) => ghost.position.row >= 0 && ghost.position.col >= 0,
	);
};

/**
 * Checks if a position is valid for player ghost placement (rows 4-5, cols 1-4).
 */
export const isValidPlayerPlacement = (position: {
	row: number;
	col: number;
}): boolean => {
	return (
		position.row >= 4 &&
		position.row <= 5 &&
		position.col >= 1 &&
		position.col <= 4
	);
};

/**
 * Places a player ghost at a specific position.
 */
export const placePlayerGhost = (
	gameState: GameState,
	ghost: Ghost,
	position: { row: number; col: number },
): GameState => {
	if (!isValidPlayerPlacement(position)) {
		throw new Error("Invalid placement position");
	}

	// Check if position is already occupied
	if (gameState.board[position.row][position.col] !== null) {
		throw new Error("Position already occupied");
	}

	// Update ghost position
	const updatedGhost = { ...ghost, position };

	// Update player ghosts array
	const updatedPlayerGhosts = gameState.playerGhosts.map((g) =>
		g.id === ghost.id ? updatedGhost : g,
	);

	// Update board
	const newBoard = gameState.board.map((row) => [...row]);

	// Remove ghost from old position if it was placed
	if (ghost.position.row >= 0 && ghost.position.col >= 0) {
		newBoard[ghost.position.row][ghost.position.col] = null;
	}

	// Place ghost at new position
	newBoard[position.row][position.col] = updatedGhost;

	return {
		...gameState,
		board: newBoard,
		playerGhosts: updatedPlayerGhosts,
	};
};

/**
 * Transitions the game from setup phase to playing phase.
 */
export const startGamePhase = (gameState: GameState): GameState => {
	if (!areAllPlayerGhostsPlaced(gameState.playerGhosts)) {
		throw new Error("Cannot start game: not all player ghosts are placed");
	}

	// Hide player ghosts (make them unrevealed)
	const hiddenPlayerGhosts = gameState.playerGhosts.map((ghost) => ({
		...ghost,
		isRevealed: false,
	}));

	// Update board with hidden ghosts
	const newBoard = gameState.board.map((row) => [...row]);
	hiddenPlayerGhosts.forEach((ghost) => {
		newBoard[ghost.position.row][ghost.position.col] = ghost;
	});

	return {
		...gameState,
		board: newBoard,
		playerGhosts: hiddenPlayerGhosts,
		gamePhase: "playing",
	};
};
