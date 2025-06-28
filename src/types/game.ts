export type GhostColor = "red" | "blue";
export type Player = "player" | "computer";
export type GamePhase = "setup" | "playing" | "finished";

export interface Position {
	row: number;
	col: number;
}

export interface Ghost {
	id: string;
	color: GhostColor;
	position: Position;
	owner: Player;
	isRevealed: boolean;
}

export interface Move {
	from: Position;
	to: Position;
	ghost: Ghost;
	capturedGhost?: Ghost;
}

export interface GameState {
	board: (Ghost | null)[][];
	currentPlayer: Player;
	gamePhase: GamePhase;
	selectedPiece: Position | null;
	moveHistory: Move[];
	playerGhosts: Ghost[];
	computerGhosts: Ghost[];
	capturedGhosts: Ghost[];
	winner?: Player;
	winCondition?: "capture_all_blue" | "lose_all_red" | "escape";
}

export interface GameSettings {
	boardSize: number;
	ghostsPerPlayer: number;
	redGhostsPerPlayer: number;
	blueGhostsPerPlayer: number;
}
