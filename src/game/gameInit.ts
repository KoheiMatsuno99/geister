import type { GameState, Ghost } from "../types/game";
import { BOARD_SIZE } from "./rules";

/**
 * Creates the initial game state with ghosts placed in starting positions.
 */
export const createInitialGameState = (): GameState => {
	const playerGhosts = createPlayerGhosts();
	const computerGhosts = createComputerGhosts();
	const board = createInitialBoard(playerGhosts, computerGhosts);

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

const createPlayerGhosts = (): Ghost[] => [
	{
		id: "p1",
		color: "blue",
		position: { row: 5, col: 1 },
		owner: "player",
		isRevealed: false,
	},
	{
		id: "p2",
		color: "blue",
		position: { row: 5, col: 2 },
		owner: "player",
		isRevealed: false,
	},
	{
		id: "p3",
		color: "red",
		position: { row: 5, col: 3 },
		owner: "player",
		isRevealed: false,
	},
	{
		id: "p4",
		color: "red",
		position: { row: 5, col: 4 },
		owner: "player",
		isRevealed: false,
	},
	{
		id: "p5",
		color: "blue",
		position: { row: 4, col: 1 },
		owner: "player",
		isRevealed: false,
	},
	{
		id: "p6",
		color: "blue",
		position: { row: 4, col: 2 },
		owner: "player",
		isRevealed: false,
	},
	{
		id: "p7",
		color: "red",
		position: { row: 4, col: 3 },
		owner: "player",
		isRevealed: false,
	},
	{
		id: "p8",
		color: "red",
		position: { row: 4, col: 4 },
		owner: "player",
		isRevealed: false,
	},
];

const createComputerGhosts = (): Ghost[] => [
	{
		id: "c1",
		color: "blue",
		position: { row: 0, col: 1 },
		owner: "computer",
		isRevealed: false,
	},
	{
		id: "c2",
		color: "blue",
		position: { row: 0, col: 2 },
		owner: "computer",
		isRevealed: false,
	},
	{
		id: "c3",
		color: "red",
		position: { row: 0, col: 3 },
		owner: "computer",
		isRevealed: false,
	},
	{
		id: "c4",
		color: "red",
		position: { row: 0, col: 4 },
		owner: "computer",
		isRevealed: false,
	},
	{
		id: "c5",
		color: "blue",
		position: { row: 1, col: 1 },
		owner: "computer",
		isRevealed: false,
	},
	{
		id: "c6",
		color: "blue",
		position: { row: 1, col: 2 },
		owner: "computer",
		isRevealed: false,
	},
	{
		id: "c7",
		color: "red",
		position: { row: 1, col: 3 },
		owner: "computer",
		isRevealed: false,
	},
	{
		id: "c8",
		color: "red",
		position: { row: 1, col: 4 },
		owner: "computer",
		isRevealed: false,
	},
];

const createInitialBoard = (playerGhosts: Ghost[], computerGhosts: Ghost[]) => {
	const board = Array(BOARD_SIZE)
		.fill(null)
		.map(() => Array(BOARD_SIZE).fill(null));

	[...playerGhosts, ...computerGhosts].forEach((ghost) => {
		board[ghost.position.row][ghost.position.col] = ghost;
	});

	return board;
};
