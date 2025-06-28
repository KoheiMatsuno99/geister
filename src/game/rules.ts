import type {
	GameState,
	Ghost,
	GhostColor,
	Move,
	Player,
	Position,
} from "../types/game";

export const BOARD_SIZE = 6;

export const isValidPosition = (pos: Position): boolean =>
	pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;

export const isEscapeSquare = (pos: Position, player: Player): boolean => {
	const escapeRow = player === "player" ? 0 : BOARD_SIZE - 1;
	const escapeColumns = [0, BOARD_SIZE - 1];

	return pos.row === escapeRow && escapeColumns.includes(pos.col);
};

export const canMove = (
	gameState: GameState,
	from: Position,
	to: Position,
): boolean => {
	if (!isValidPosition(from) || !isValidPosition(to)) return false;

	const ghost = gameState.board[from.row][from.col];
	if (!ghost || ghost.owner !== gameState.currentPlayer) return false;

	const isAdjacentMove = (from: Position, to: Position): boolean => {
		const deltaRow = Math.abs(to.row - from.row);
		const deltaCol = Math.abs(to.col - from.col);
		return (
			(deltaRow === 1 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 1)
		);
	};

	if (!isAdjacentMove(from, to)) return false;

	const targetCell = gameState.board[to.row][to.col];
	return !targetCell || targetCell.owner !== gameState.currentPlayer;
};

export const executeMove = (gameState: GameState, move: Move): GameState => {
	const newBoard = gameState.board.map((row) => [...row]);
	const newCapturedGhosts = move.capturedGhost
		? [...gameState.capturedGhosts, move.capturedGhost]
		: [...gameState.capturedGhosts];

	newBoard[move.from.row][move.from.col] = null;
	newBoard[move.to.row][move.to.col] = {
		...move.ghost,
		position: move.to,
	};

	const nextPlayer: Player =
		gameState.currentPlayer === "player" ? "computer" : "player";

	return {
		...gameState,
		board: newBoard,
		currentPlayer: nextPlayer,
		selectedPiece: null,
		moveHistory: [...gameState.moveHistory, move],
		capturedGhosts: newCapturedGhosts,
	};
};

export const checkWinCondition = (
	gameState: GameState,
): {
	winner?: Player;
	condition?: "capture_all_blue" | "lose_all_red" | "escape";
} => {
	// Declarative approach: check conditions in priority order
	const escapeWin = checkEscapeCondition(gameState);
	if (escapeWin.winner) return escapeWin;

	const captureWin = checkCaptureCondition(gameState);
	if (captureWin.winner) return captureWin;

	const redLossWin = checkRedLossCondition(gameState);
	if (redLossWin.winner) return redLossWin;

	return {};
};

const checkEscapeCondition = (gameState: GameState) => {
	const isEscapedGhost = (ghost: Ghost, player: Player) =>
		ghost.color === "blue" &&
		isEscapeSquare(ghost.position, player) &&
		!gameState.capturedGhosts.includes(ghost);

	const playerEscaped = gameState.playerGhosts.some((ghost) =>
		isEscapedGhost(ghost, "player"),
	);
	const computerEscaped = gameState.computerGhosts.some((ghost) =>
		isEscapedGhost(ghost, "computer"),
	);

	if (playerEscaped)
		return { winner: "player" as const, condition: "escape" as const };
	if (computerEscaped)
		return { winner: "computer" as const, condition: "escape" as const };

	return {};
};

const checkCaptureCondition = (gameState: GameState) => {
	const countActiveGhosts = (ghosts: Ghost[], color: GhostColor) =>
		ghosts.filter(
			(ghost) =>
				ghost.color === color && !gameState.capturedGhosts.includes(ghost),
		).length;

	const playerBlueCount = countActiveGhosts(gameState.playerGhosts, "blue");
	const computerBlueCount = countActiveGhosts(gameState.computerGhosts, "blue");

	if (playerBlueCount === 0) {
		return {
			winner: "computer" as const,
			condition: "capture_all_blue" as const,
		};
	}
	if (computerBlueCount === 0) {
		return {
			winner: "player" as const,
			condition: "capture_all_blue" as const,
		};
	}

	return {};
};

const checkRedLossCondition = (gameState: GameState) => {
	const countActiveGhosts = (ghosts: Ghost[], color: GhostColor) =>
		ghosts.filter(
			(ghost) =>
				ghost.color === color && !gameState.capturedGhosts.includes(ghost),
		).length;

	const playerRedCount = countActiveGhosts(gameState.playerGhosts, "red");
	const computerRedCount = countActiveGhosts(gameState.computerGhosts, "red");

	if (playerRedCount === 0) {
		return { winner: "player" as const, condition: "lose_all_red" as const };
	}
	if (computerRedCount === 0) {
		return { winner: "computer" as const, condition: "lose_all_red" as const };
	}

	return {};
};
