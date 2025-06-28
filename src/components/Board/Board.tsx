import { memo } from "react";
import { canMove } from "../../game/rules";
import type { GameState, Ghost, Position } from "../../types/game";
import "./Board.css";

export interface BoardProps {
	gameState: GameState;
	onCellClick: (position: Position) => void;
	onGhostClick: (ghost: Ghost) => void;
}

export const Board = memo(
	({ gameState, onCellClick, onGhostClick }: BoardProps) => {
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

			const cellClasses = [
				"board-cell",
				isSelected && "board-cell--selected",
				isValidTarget && "board-cell--valid-target",
				isEscapeSquare && "board-cell--escape",
				ghost && "board-cell--occupied",
			]
				.filter(Boolean)
				.join(" ");

			return (
				<button
					key={`${row}-${col}`}
					type="button"
					className={cellClasses}
					onClick={() => handleCellClick(row, col)}
					aria-label={`Cell at row ${row + 1}, column ${col + 1}${ghost ? `, contains ${ghost.color} ghost` : ""}${isValidTarget ? ", valid move target" : ""}`}
					data-testid={`cell-${row}-${col}`}
				>
					{ghost && (
						<div
							className={`ghost ghost--${ghost.color} ghost--${ghost.owner} ${ghost.isRevealed ? "ghost--revealed" : "ghost--hidden"}`}
							data-testid={`ghost-${ghost.id}`}
						>
							{ghost.isRevealed ? (
								<span className="ghost-color">{ghost.color}</span>
							) : (
								<span className="ghost-unknown">?</span>
							)}
						</div>
					)}
					{isValidTarget && <div className="valid-move-indicator" />}
				</button>
			);
		};

		return (
			<table className="board" aria-label="Geister game board">
				<tbody>
					{[0, 1, 2, 3, 4, 5].map((row) => (
						<tr key={`row-${row}`} className="board-row">
							{[0, 1, 2, 3, 4, 5].map((col) => (
								<td key={`cell-${row}-${col}`} className="board-cell-container">
									{renderCell(row, col)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		);
	},
);

Board.displayName = "Board";
