import type {
	GameState,
	Ghost,
	GhostColor,
	Player,
	Position,
} from "../../types/game";
import { isEscapeSquare } from "../rules";

/**
 * Evaluates the current position for the given player.
 * Returns a score where positive values favor the player.
 */
export const evaluatePosition = (
	gameState: GameState,
	forPlayer: Player,
): number => {
	const gameResult = checkGameResult(gameState);

	if (gameResult.winner === forPlayer) return 1000;
	if (gameResult.winner && gameResult.winner !== forPlayer) return -1000;

	let score = 0;

	score += evaluateMaterial(gameState, forPlayer);
	score += evaluatePositional(gameState, forPlayer);
	score += evaluateEscapeThreats(gameState, forPlayer);

	return score;
};

const checkGameResult = (gameState: GameState): { winner?: Player } => {
	const playerBlueCount = gameState.playerGhosts.filter(
		(ghost) =>
			ghost.color === "blue" && !gameState.capturedGhosts.includes(ghost),
	).length;
	const computerBlueCount = gameState.computerGhosts.filter(
		(ghost) =>
			ghost.color === "blue" && !gameState.capturedGhosts.includes(ghost),
	).length;

	const playerRedCount = gameState.playerGhosts.filter(
		(ghost) =>
			ghost.color === "red" && !gameState.capturedGhosts.includes(ghost),
	).length;
	const computerRedCount = gameState.computerGhosts.filter(
		(ghost) =>
			ghost.color === "red" && !gameState.capturedGhosts.includes(ghost),
	).length;

	// Win by capturing all opponent's blue ghosts
	if (playerBlueCount === 0) return { winner: "computer" };
	if (computerBlueCount === 0) return { winner: "player" };

	// Win by losing all own red ghosts
	if (playerRedCount === 0) return { winner: "player" };
	if (computerRedCount === 0) return { winner: "computer" };

	// Win by escaping with blue ghost
	const playerEscaped = gameState.playerGhosts.some(
		(ghost) =>
			ghost.color === "blue" &&
			isEscapeSquare(ghost.position, "player") &&
			!gameState.capturedGhosts.includes(ghost),
	);

	const computerEscaped = gameState.computerGhosts.some(
		(ghost) =>
			ghost.color === "blue" &&
			isEscapeSquare(ghost.position, "computer") &&
			!gameState.capturedGhosts.includes(ghost),
	);

	if (playerEscaped) return { winner: "player" };
	if (computerEscaped) return { winner: "computer" };

	return {};
};

const evaluateMaterial = (gameState: GameState, forPlayer: Player): number => {
	const [myGhosts, opponentGhosts] = getPlayerGhosts(gameState, forPlayer);

	const countActiveGhosts = (ghosts: Ghost[], color: GhostColor) =>
		ghosts.filter(isActiveGhost(gameState)).filter(hasColor(color)).length;

	const materialCounts = {
		myBlue: countActiveGhosts(myGhosts, "blue"),
		myRed: countActiveGhosts(myGhosts, "red"),
		opponentBlue: countActiveGhosts(opponentGhosts, "blue"),
		opponentRed: countActiveGhosts(opponentGhosts, "red"),
	};

	// Declarative material evaluation
	return calculateMaterialScore(materialCounts);
};

const getPlayerGhosts = (gameState: GameState, forPlayer: Player) =>
	forPlayer === "player"
		? [gameState.playerGhosts, gameState.computerGhosts]
		: [gameState.computerGhosts, gameState.playerGhosts];

const isActiveGhost = (gameState: GameState) => (ghost: Ghost) =>
	!gameState.capturedGhosts.includes(ghost);

const hasColor = (color: GhostColor) => (ghost: Ghost) => ghost.color === color;

const calculateMaterialScore = (counts: {
	myBlue: number;
	myRed: number;
	opponentBlue: number;
	opponentRed: number;
}) => {
	const BLUE_VALUE = 50;
	const RED_PENALTY = 20;
	const MAX_RED_GHOSTS = 4;

	return (
		counts.myBlue * BLUE_VALUE -
		counts.opponentBlue * BLUE_VALUE +
		(MAX_RED_GHOSTS - counts.myRed) * RED_PENALTY -
		(MAX_RED_GHOSTS - counts.opponentRed) * RED_PENALTY
	);
};

const evaluatePositional = (
	gameState: GameState,
	forPlayer: Player,
): number => {
	const [myGhosts] = getPlayerGhosts(gameState, forPlayer);

	return myGhosts
		.filter(isActiveGhost(gameState))
		.map(evaluateGhostPosition(forPlayer))
		.reduce((sum, score) => sum + score, 0);
};

const evaluateGhostPosition = (forPlayer: Player) => (ghost: Ghost) => {
	const escapeScore =
		ghost.color === "blue"
			? calculateEscapeScore(ghost.position, forPlayer)
			: 0;

	const centerScore = calculateCenterScore(ghost.position);

	return escapeScore + centerScore;
};

const calculateEscapeScore = (position: Position, forPlayer: Player) => {
	const targetRow = forPlayer === "player" ? 0 : 5;
	const ESCAPE_WEIGHT = 5;
	const MAX_DISTANCE = 6;

	const distanceToEscape = Math.min(
		Math.abs(position.row - targetRow) + Math.abs(position.col - 0),
		Math.abs(position.row - targetRow) + Math.abs(position.col - 5),
	);

	return (MAX_DISTANCE - distanceToEscape) * ESCAPE_WEIGHT;
};

const calculateCenterScore = (position: Position) => {
	const CENTER_WEIGHT = 2;
	const MAX_CENTER_DISTANCE = 5;
	const centerDistance =
		Math.abs(position.row - 2.5) + Math.abs(position.col - 2.5);

	return (MAX_CENTER_DISTANCE - centerDistance) * CENTER_WEIGHT;
};

const evaluateEscapeThreats = (
	gameState: GameState,
	forPlayer: Player,
): number => {
	const [myGhosts] = getPlayerGhosts(gameState, forPlayer);

	const IMMEDIATE_ESCAPE_BONUS = 100;

	return (
		myGhosts
			.filter(isActiveGhost(gameState))
			.filter(hasColor("blue"))
			.filter(isImmediateEscapeThreat(forPlayer)).length *
		IMMEDIATE_ESCAPE_BONUS
	);
};

const isImmediateEscapeThreat = (forPlayer: Player) => (ghost: Ghost) => {
	const escapeRow = forPlayer === "player" ? 0 : 5;
	const adjacentRow = escapeRow + (forPlayer === "player" ? 1 : -1);
	const isAdjacentToEscapeRow = ghost.position.row === adjacentRow;
	const isInEscapeColumn = ghost.position.col === 0 || ghost.position.col === 5;

	return isAdjacentToEscapeRow && isInEscapeColumn;
};
