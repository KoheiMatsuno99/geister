import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialGameState } from "../../game/gameInit";
import type { GameState } from "../../types/game";
import { GhostSetup } from "./GhostSetup";

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

const renderWithDndContext = (component: React.ReactElement) => {
	return render(<DndContext>{component}</DndContext>);
};

describe("GhostSetup", () => {
	const mockOnPlaceGhost = vi.fn();
	const mockOnStartGame = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("rendering", () => {
		it("should render setup header and instructions", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			expect(screen.getByText("Place Your Ghosts")).toBeInTheDocument();
			expect(
				screen.getByText(
					"Drag your ghosts to the highlighted area (rows 4-5, columns 1-4)",
				),
			).toBeInTheDocument();
		});

		it("should render Available Ghosts section", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			expect(screen.getByText("Available Ghosts")).toBeInTheDocument();
		});

		it("should render 6x6 board grid", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			// Check for 36 setup cells (6x6 grid)
			const setupCells = screen.getAllByTestId(/setup-cell-\d+-\d+/);
			expect(setupCells).toHaveLength(36);
		});

		it("should show all 8 unplaced ghosts initially", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			// Count ghost images in the available list
			const ghostImages = screen.getAllByAltText(/ghost$/);
			const unplacedGhosts = ghostImages.filter((img) =>
				img.className.includes("ghost-item-image"),
			);
			expect(unplacedGhosts).toHaveLength(8);
		});
	});

	describe("ghost placement states", () => {
		it("should show computer ghosts as unknown on board", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			// Computer ghosts should be shown as unknown
			const unknownGhosts = screen.getAllByAltText("Unknown ghost");
			expect(unknownGhosts.length).toBeGreaterThan(0);
		});

		it("should hide placed ghosts from available list", () => {
			const gameState = createInitialGameState();
			// Simulate placing first ghost
			const placedGhost = {
				...gameState.playerGhosts[0],
				position: { row: 4, col: 1 },
			};
			const updatedGameState: GameState = {
				...gameState,
				playerGhosts: [placedGhost, ...gameState.playerGhosts.slice(1)],
				board: gameState.board.map((row, rowIndex) =>
					row.map((cell, colIndex) =>
						rowIndex === 4 && colIndex === 1 ? placedGhost : cell,
					),
				),
			};

			renderWithDndContext(
				<GhostSetup
					gameState={updatedGameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			// Should have 7 unplaced ghosts now
			const ghostImages = screen.getAllByAltText(/ghost$/);
			const unplacedGhosts = ghostImages.filter((img) =>
				img.className.includes("ghost-item-image"),
			);
			expect(unplacedGhosts).toHaveLength(7);
		});

		it("should show all ghosts placed message when complete", () => {
			const gameState = createInitialGameState();
			// Simulate all ghosts placed
			const placedGhosts = gameState.playerGhosts.map((ghost, index) => ({
				...ghost,
				position: {
					row: 4 + Math.floor(index / 4),
					col: 1 + (index % 4),
				},
			}));

			const updatedGameState: GameState = {
				...gameState,
				playerGhosts: placedGhosts,
			};

			renderWithDndContext(
				<GhostSetup
					gameState={updatedGameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			expect(screen.getByText("All ghosts placed!")).toBeInTheDocument();
		});
	});

	describe("start game button", () => {
		it("should be disabled when ghosts are unplaced", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			const startButton = screen.getByRole("button", {
				name: /place \d+ more ghost/,
			});
			expect(startButton).toBeDisabled();
		});

		it("should be enabled when all ghosts are placed", () => {
			const gameState = createInitialGameState();
			// Simulate all ghosts placed
			const placedGhosts = gameState.playerGhosts.map((ghost, index) => ({
				...ghost,
				position: {
					row: 4 + Math.floor(index / 4),
					col: 1 + (index % 4),
				},
			}));

			const updatedGameState: GameState = {
				...gameState,
				playerGhosts: placedGhosts,
			};

			renderWithDndContext(
				<GhostSetup
					gameState={updatedGameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			const startButton = screen.getByRole("button", { name: "Start Game" });
			expect(startButton).toBeEnabled();
		});

		it("should show correct count of remaining ghosts", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			expect(
				screen.getByRole("button", { name: "Place 8 more ghost(s)" }),
			).toBeInTheDocument();
		});
	});

	describe("valid placement areas", () => {
		it("should highlight valid placement cells (rows 4-5, cols 1-4)", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			// Valid positions: (4,1), (4,2), (4,3), (4,4), (5,1), (5,2), (5,3), (5,4)
			const validCells = [
				screen.getByTestId("setup-cell-4-1"),
				screen.getByTestId("setup-cell-4-2"),
				screen.getByTestId("setup-cell-4-3"),
				screen.getByTestId("setup-cell-4-4"),
				screen.getByTestId("setup-cell-5-1"),
				screen.getByTestId("setup-cell-5-2"),
				screen.getByTestId("setup-cell-5-3"),
				screen.getByTestId("setup-cell-5-4"),
			];

			validCells.forEach((cell) => {
				expect(cell).toHaveClass("setup-cell--valid");
			});
		});

		it("should not highlight invalid placement cells", () => {
			const gameState = createInitialGameState();

			renderWithDndContext(
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={mockOnPlaceGhost}
					onStartGame={mockOnStartGame}
				/>,
			);

			// Invalid positions: corners and computer area
			const invalidCells = [
				screen.getByTestId("setup-cell-0-0"), // Corner
				screen.getByTestId("setup-cell-0-5"), // Corner
				screen.getByTestId("setup-cell-1-1"), // Computer area
				screen.getByTestId("setup-cell-3-3"), // Middle area
			];

			invalidCells.forEach((cell) => {
				expect(cell).not.toHaveClass("setup-cell--valid");
			});
		});
	});
});
