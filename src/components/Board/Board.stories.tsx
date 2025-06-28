import type { Meta, StoryObj } from "@storybook/react-vite";
import { createInitialGameState } from "../../game/gameInit";
import type { GameState } from "../../types/game";
import { Board } from "./Board";

const meta: Meta<typeof Board> = {
	title: "Components/Board",
	component: Board,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"The main game board component that displays the 6x6 grid with ghosts and handles user interactions.",
			},
		},
	},
	argTypes: {
		gameState: {
			description:
				"Current game state containing board, ghosts, and player information",
		},
		onCellClick: {
			description: "Callback when an empty cell is clicked",
		},
		onGhostClick: {
			description: "Callback when a ghost is clicked",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Board>;

const initialGameState = createInitialGameState();

export const Default: Story = {
	args: {
		gameState: initialGameState,
		onCellClick: () => {},
		onGhostClick: () => {},
	},
};

export const WithSelectedPiece: Story = {
	args: {
		gameState: {
			...initialGameState,
			selectedPiece: initialGameState.playerGhosts[0],
			playerGhosts: initialGameState.playerGhosts.map((ghost, index) => ({
				...ghost,
				isRevealed: index === 0,
			})),
		},
		onCellClick: () => {},
		onGhostClick: () => {},
	},
};

export const WithRevealedGhosts: Story = {
	args: {
		gameState: {
			...initialGameState,
			playerGhosts: initialGameState.playerGhosts.map((ghost) => ({
				...ghost,
				isRevealed: true,
			})),
			computerGhosts: initialGameState.computerGhosts.map((ghost) => ({
				...ghost,
				isRevealed: true,
			})),
		},
		onCellClick: () => {},
		onGhostClick: () => {},
	},
};

export const ComputerTurn: Story = {
	args: {
		gameState: {
			...initialGameState,
			currentPlayer: "computer",
			computerGhosts: initialGameState.computerGhosts.map((ghost, index) => ({
				...ghost,
				isRevealed: index < 2,
			})),
		},
		onCellClick: () => {},
		onGhostClick: () => {},
	},
};

export const MidGame: Story = {
	args: {
		gameState: (() => {
			const gameState: GameState = {
				...initialGameState,
				selectedPiece: null,
			};

			// Move some ghosts to create a mid-game scenario
			gameState.playerGhosts[0].position = { row: 3, col: 2 };
			gameState.playerGhosts[0].isRevealed = true;
			gameState.playerGhosts[1].position = { row: 4, col: 1 };
			gameState.playerGhosts[1].isRevealed = true;

			gameState.computerGhosts[0].position = { row: 2, col: 3 };
			gameState.computerGhosts[0].isRevealed = true;
			gameState.computerGhosts[1].position = { row: 1, col: 4 };
			gameState.computerGhosts[1].isRevealed = true;

			// Update board - clear original positions
			gameState.board[5][1] = null;
			gameState.board[5][2] = null;
			gameState.board[0][1] = null;
			gameState.board[0][2] = null;

			// Set new positions
			gameState.board[3][2] = gameState.playerGhosts[0];
			gameState.board[4][1] = gameState.playerGhosts[1];
			gameState.board[2][3] = gameState.computerGhosts[0];
			gameState.board[1][4] = gameState.computerGhosts[1];

			return gameState;
		})(),
		onCellClick: () => {},
		onGhostClick: () => {},
	},
};
