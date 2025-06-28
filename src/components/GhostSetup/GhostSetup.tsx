import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { memo, useState } from "react";
import blueGhostImg from "../../assets/blueGhost.jpeg";
import redGhostImg from "../../assets/redGhost.jpeg";
import unknownGhostImg from "../../assets/unknownGhost.jpeg";
import {
	areAllPlayerGhostsPlaced,
	isValidPlayerPlacement,
} from "../../game/gameInit";
import type { GameState, Ghost, Position } from "../../types/game";
import "./GhostSetup.css";

export interface GhostSetupProps {
	gameState: GameState;
	onPlaceGhost: (ghost: Ghost, position: Position) => void;
	onStartGame: () => void;
}

interface DraggableGhostItemProps {
	ghost: Ghost;
}

const DraggableGhostItem = memo(({ ghost }: DraggableGhostItemProps) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `unplaced-ghost-${ghost.id}`,
			data: ghost,
		});

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined;

	if (ghost.position.row >= 0) {
		// Ghost is already placed, don't show in list
		return null;
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`ghost-item ${isDragging ? "ghost-item--dragging" : ""}`}
			{...listeners}
			{...attributes}
		>
			<img
				src={ghost.color === "blue" ? blueGhostImg : redGhostImg}
				alt={`${ghost.color} ghost`}
				className="ghost-item-image"
			/>
		</div>
	);
});

DraggableGhostItem.displayName = "DraggableGhostItem";

interface DroppableSetupCellProps {
	row: number;
	col: number;
	ghost: Ghost | null;
	isValidPlacement: boolean;
}

const DroppableSetupCell = memo(
	({ row, col, ghost, isValidPlacement }: DroppableSetupCellProps) => {
		const { isOver, setNodeRef } = useDroppable({
			id: `setup-cell-${row}-${col}`,
		});

		const cellClasses = [
			"setup-cell",
			isValidPlacement && "setup-cell--valid",
			ghost && "setup-cell--occupied",
			isOver && isValidPlacement && "setup-cell--drop-target",
		]
			.filter(Boolean)
			.join(" ");

		return (
			<div
				ref={setNodeRef}
				className={cellClasses}
				data-testid={`setup-cell-${row}-${col}`}
			>
				{ghost && (
					<div className="placed-ghost">
						<img
							src={
								ghost.owner === "computer"
									? unknownGhostImg
									: ghost.color === "blue"
										? blueGhostImg
										: redGhostImg
							}
							alt={
								ghost.owner === "computer"
									? "Unknown ghost"
									: `${ghost.color} ghost`
							}
							className="placed-ghost-image"
						/>
					</div>
				)}
			</div>
		);
	},
);

DroppableSetupCell.displayName = "DroppableSetupCell";

export const GhostSetup = memo(
	({ gameState, onPlaceGhost, onStartGame }: GhostSetupProps) => {
		const [activeGhost, setActiveGhost] = useState<Ghost | null>(null);
		const sensors = useSensors(
			useSensor(PointerSensor, {
				activationConstraint: {
					distance: 8,
				},
			}),
		);

		const handleDragStart = (event: DragStartEvent) => {
			const ghost = event.active.data.current as Ghost;
			setActiveGhost(ghost);
		};

		const handleDragEnd = (event: DragEndEvent) => {
			const { active, over } = event;
			setActiveGhost(null);

			if (!over) return;

			const ghost = active.data.current as Ghost;
			const cellId = over.id as string;

			if (cellId.startsWith("setup-cell-")) {
				const [, , rowStr, colStr] = cellId.split("-");
				const position: Position = {
					row: Number.parseInt(rowStr, 10),
					col: Number.parseInt(colStr, 10),
				};

				if (isValidPlayerPlacement(position)) {
					onPlaceGhost(ghost, position);
				}
			}
		};

		const unplacedGhosts = gameState.playerGhosts.filter(
			(ghost) => ghost.position.row < 0,
		);
		const allGhostsPlaced = areAllPlayerGhostsPlaced(gameState.playerGhosts);

		return (
			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<div className="ghost-setup">
					<div className="setup-header">
						<h2>Place Your Ghosts</h2>
						<p>
							Drag your ghosts to the highlighted area (rows 4-5, columns 1-4)
						</p>
					</div>

					<div className="setup-content">
						<div className="setup-board">
							<div className="board-grid">
								{[0, 1, 2, 3, 4, 5].map((row) => (
									<div key={`row-${row}`} className="board-row">
										{[0, 1, 2, 3, 4, 5].map((col) => {
											const ghost = gameState.board[row][col];
											const isValidPlacement = isValidPlayerPlacement({
												row,
												col,
											});
											return (
												<DroppableSetupCell
													key={`cell-${row}-${col}`}
													row={row}
													col={col}
													ghost={ghost}
													isValidPlacement={isValidPlacement}
												/>
											);
										})}
									</div>
								))}
							</div>
						</div>

						<div className="ghost-list">
							<h3>Available Ghosts</h3>
							<div className="ghost-items">
								{unplacedGhosts.map((ghost) => (
									<DraggableGhostItem key={ghost.id} ghost={ghost} />
								))}
							</div>
							{unplacedGhosts.length === 0 && (
								<p className="all-placed">All ghosts placed!</p>
							)}
						</div>
					</div>

					<div className="setup-actions">
						<button
							type="button"
							className="start-game-button"
							onClick={onStartGame}
							disabled={!allGhostsPlaced}
						>
							{allGhostsPlaced
								? "Start Game"
								: `Place ${unplacedGhosts.length} more ghost(s)`}
						</button>
					</div>

					<DragOverlay>
						{activeGhost ? (
							<div className="ghost-item ghost-item--dragging">
								<img
									src={
										activeGhost.color === "blue" ? blueGhostImg : redGhostImg
									}
									alt={`${activeGhost.color} ghost`}
									className="ghost-item-image"
								/>
							</div>
						) : null}
					</DragOverlay>
				</div>
			</DndContext>
		);
	},
);

GhostSetup.displayName = "GhostSetup";
