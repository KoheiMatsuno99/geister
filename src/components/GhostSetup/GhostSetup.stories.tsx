import {
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { createInitialGameState, placePlayerGhost } from "../../game/gameInit";
import type { GameState, Ghost, Position } from "../../types/game";
import { GhostSetup } from "./GhostSetup";

const meta: Meta<typeof GhostSetup> = {
	title: "Components/GhostSetup",
	component: GhostSetup,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Setup phase component where players drag and drop their ghosts to initial positions. Computer ghosts are randomly placed, player ghosts must be manually positioned in the back 2 rows.",
			},
		},
	},
	decorators: [
		(Story) => {
			const sensors = useSensors(
				useSensor(PointerSensor, {
					activationConstraint: {
						distance: 8,
					},
				}),
			);
			return (
				<DndContext sensors={sensors}>
					<Story />
				</DndContext>
			);
		},
	],
	argTypes: {
		onPlaceGhost: { action: "ghost placed" },
		onStartGame: { action: "game started" },
	},
};

export default meta;
type Story = StoryObj<typeof GhostSetup>;

// Helper function to create game state with some ghosts placed
const createPartiallyPlacedGameState = (): GameState => {
	const gameState = createInitialGameState();
	// Place 4 ghosts to show partially completed setup
	const placedGhosts = gameState.playerGhosts
		.slice(0, 4)
		.map((ghost, index) => ({
			...ghost,
			position: {
				row: 4 + Math.floor(index / 4),
				col: 1 + (index % 4),
			},
		}));

	const unplacedGhosts = gameState.playerGhosts.slice(4);
	const updatedPlayerGhosts = [...placedGhosts, ...unplacedGhosts];

	// Update board with placed ghosts
	const newBoard = gameState.board.map((row) => [...row]);
	placedGhosts.forEach((ghost) => {
		newBoard[ghost.position.row][ghost.position.col] = ghost;
	});

	return {
		...gameState,
		playerGhosts: updatedPlayerGhosts,
		board: newBoard,
	};
};

// Helper function to create game state with all ghosts placed
const createFullyPlacedGameState = (): GameState => {
	const gameState = createInitialGameState();
	// Place all 8 ghosts
	const placedGhosts = gameState.playerGhosts.map((ghost, index) => ({
		...ghost,
		position: {
			row: 4 + Math.floor(index / 4),
			col: 1 + (index % 4),
		},
	}));

	// Update board with all placed ghosts
	const newBoard = gameState.board.map((row) => [...row]);
	placedGhosts.forEach((ghost) => {
		newBoard[ghost.position.row][ghost.position.col] = ghost;
	});

	return {
		...gameState,
		playerGhosts: placedGhosts,
		board: newBoard,
	};
};

export const InitialSetup: Story = {
	args: {
		gameState: createInitialGameState(),
		onPlaceGhost: () => {},
		onStartGame: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Initial setup state with all player ghosts unplaced. Computer ghosts are randomly positioned in rows 0-1. Player must drag all 8 ghosts to valid positions (rows 4-5, columns 1-4).",
			},
		},
	},
};

export const PartiallyPlaced: Story = {
	args: {
		gameState: createPartiallyPlacedGameState(),
		onPlaceGhost: () => {},
		onStartGame: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Setup in progress with 4 ghosts already placed. Shows the interface when some ghosts are positioned and others are still available for placement.",
			},
		},
	},
};

export const AllGhostsPlaced: Story = {
	args: {
		gameState: createFullyPlacedGameState(),
		onPlaceGhost: () => {},
		onStartGame: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Setup complete with all 8 player ghosts placed in valid positions. The 'Start Game' button is now enabled and the available ghosts list shows 'All ghosts placed!'",
			},
		},
	},
};

// Interactive wrapper component that manages state
const InteractiveGhostSetup = () => {
	const [gameState, setGameState] = useState<GameState>(
		createPartiallyPlacedGameState(),
	);

	const handlePlaceGhost = (ghost: Ghost, position: Position) => {
		console.log(
			`Placing ${ghost.color} ghost at (${position.row}, ${position.col})`,
		);
		try {
			const newGameState = placePlayerGhost(gameState, ghost, position);
			setGameState(newGameState);
		} catch (error) {
			console.error("Failed to place ghost:", error);
		}
	};

	const handleStartGame = () => {
		console.log("Starting game!");
		alert("Game would start now! (This is just a demo)");
	};

	return (
		<GhostSetup
			gameState={gameState}
			onPlaceGhost={handlePlaceGhost}
			onStartGame={handleStartGame}
		/>
	);
};

export const Interactive: Story = {
	render: () => <InteractiveGhostSetup />,
	parameters: {
		docs: {
			description: {
				story:
					"Fully interactive version with working drag & drop functionality and state management. You can actually drag ghosts to place them on the board. Open browser console to see placement actions.",
			},
		},
	},
};
