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
import { canMove } from "../../game/rules";
import type { GameState, Ghost, Position } from "../../types/game";
import "./Board.css";

export interface BoardProps {
	gameState: GameState;
	onCellClick: (position: Position) => void;
	onGhostClick: (ghost: Ghost) => void;
	onGhostMove?: (ghost: Ghost, newPosition: Position) => void;
}

interface DraggableGhostProps {
	ghost: Ghost;
	isSelected: boolean;
	onGhostClick: (ghost: Ghost) => void;
}

const DraggableGhost = memo(
	({ ghost, isSelected, onGhostClick }: DraggableGhostProps) => {
		const { attributes, listeners, setNodeRef, transform, isDragging } =
			useDraggable({
				id: `ghost-${ghost.id}`,
				data: ghost,
				disabled: ghost.owner !== "player" || !ghost.isRevealed,
			});

		const style = transform
			? {
					transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				}
			: undefined;

		return (
			<button
				ref={setNodeRef}
				style={style}
				className={`ghost ghost--${ghost.color} ghost--${ghost.owner} ${ghost.isRevealed ? "ghost--revealed" : "ghost--hidden"} ${isSelected ? "ghost--selected" : ""} ${isDragging ? "ghost--dragging" : ""}`}
				data-testid={`ghost-${ghost.id}`}
				onClick={() => onGhostClick(ghost)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onGhostClick(ghost);
					}
				}}
				{...listeners}
				{...attributes}
			>
				{ghost.isRevealed || ghost.owner === "player" ? (
					<img
						src={ghost.color === "blue" ? blueGhostImg : redGhostImg}
						alt={`${ghost.color} ghost`}
						className="ghost-image"
					/>
				) : (
					<img
						src={unknownGhostImg}
						alt="Unknown ghost"
						className="ghost-image"
					/>
				)}
			</button>
		);
	},
);

DraggableGhost.displayName = "DraggableGhost";

interface DroppableCellProps {
	row: number;
	col: number;
	ghost: Ghost | null;
	isSelected: boolean;
	isValidTarget: boolean;
	isEscapeSquare: boolean;
	onCellClick: (row: number, col: number) => void;
	onGhostClick: (ghost: Ghost) => void;
}

const DroppableCell = memo(
	({
		row,
		col,
		ghost,
		isSelected,
		isValidTarget,
		isEscapeSquare,
		onCellClick,
		onGhostClick,
	}: DroppableCellProps) => {
		const { isOver, setNodeRef } = useDroppable({
			id: `cell-${row}-${col}`,
		});

		const cellClasses = [
			"board-cell",
			isSelected && "board-cell--selected",
			isValidTarget && "board-cell--valid-target",
			isEscapeSquare && "board-cell--escape",
			ghost && "board-cell--occupied",
			isOver && "board-cell--drop-target",
		]
			.filter(Boolean)
			.join(" ");

		return (
			<button
				ref={setNodeRef}
				type="button"
				className={cellClasses}
				onClick={() => onCellClick(row, col)}
				aria-label={`Cell at row ${row + 1}, column ${col + 1}${ghost ? `, contains ${ghost.color} ghost` : ""}${isValidTarget ? ", valid move target" : ""}`}
				data-testid={`cell-${row}-${col}`}
			>
				{ghost && (
					<DraggableGhost
						ghost={ghost}
						isSelected={isSelected}
						onGhostClick={onGhostClick}
					/>
				)}
				{isValidTarget && <div className="valid-move-indicator" />}
			</button>
		);
	},
);

DroppableCell.displayName = "DroppableCell";

export const Board = memo(
	({ gameState, onCellClick, onGhostClick, onGhostMove }: BoardProps) => {
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

			if (!over || !onGhostMove) return;

			const ghost = active.data.current as Ghost;
			const cellId = over.id as string;

			if (cellId.startsWith("cell-")) {
				const [, rowStr, colStr] = cellId.split("-");
				const newPosition: Position = {
					row: Number.parseInt(rowStr, 10),
					col: Number.parseInt(colStr, 10),
				};

				if (canMove(gameState, ghost.position, newPosition)) {
					onGhostMove(ghost, newPosition);
				}
			}
		};
		const isValidMoveTarget = (position: Position): boolean => {
			if (!gameState.selectedPiece) return false;
			return canMove(gameState, gameState.selectedPiece.position, position);
		};

		const handleCellClick = (row: number, col: number) => {
			const position: Position = { row, col };
			const ghost = gameState.board[row][col];

			if (ghost) {
				onGhostClick(ghost);
			} else {
				onCellClick(position);
			}
		};

		const renderCell = (row: number, col: number) => {
			const position: Position = { row, col };
			const ghost = gameState.board[row][col];
			const isSelected =
				gameState.selectedPiece?.position.row === row &&
				gameState.selectedPiece?.position.col === col;
			const isValidTarget = isValidMoveTarget(position);
			const isEscapeSquare =
				(row === 0 || row === 5) && (col === 0 || col === 5);

			return (
				<DroppableCell
					key={`${row}-${col}`}
					row={row}
					col={col}
					ghost={ghost}
					isSelected={isSelected}
					isValidTarget={isValidTarget}
					isEscapeSquare={isEscapeSquare}
					onCellClick={handleCellClick}
					onGhostClick={onGhostClick}
				/>
			);
		};

		return (
			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<table className="board" aria-label="Geister game board">
					<tbody>
						{[0, 1, 2, 3, 4, 5].map((row) => (
							<tr key={`row-${row}`} className="board-row">
								{[0, 1, 2, 3, 4, 5].map((col) => (
									<td
										key={`cell-${row}-${col}`}
										className="board-cell-container"
									>
										{renderCell(row, col)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
				<DragOverlay>
					{activeGhost ? (
						<div
							className={`ghost ghost--${activeGhost.color} ghost--${activeGhost.owner} ghost--revealed ghost--dragging`}
						>
							<img
								src={activeGhost.color === "blue" ? blueGhostImg : redGhostImg}
								alt={`${activeGhost.color} ghost`}
								className="ghost-image"
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		);
	},
);

Board.displayName = "Board";
