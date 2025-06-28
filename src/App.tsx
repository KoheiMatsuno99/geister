import { useState } from "react";
import { Board } from "./components/Board/Board";
import { Entrance } from "./components/Entrance/Entrance";
import { useGameState } from "./hooks/useGameState";
import type { Ghost, Position } from "./types/game";
import "./App.css";

type GameScreen = "entrance" | "game";

function App() {
	const [currentScreen, setCurrentScreen] = useState<GameScreen>("entrance");
	const { gameState, handleCellClick, handleGhostClick, resetGame } = useGameState();

	const handleStartGame = () => {
		resetGame();
		setCurrentScreen("game");
	};

	const handleBackToEntrance = () => {
		setCurrentScreen("entrance");
	};

	const handleGhostMove = (_ghost: Ghost, newPosition: Position) => {
		// Handle drag & drop moves - convert to position click
		handleCellClick(newPosition);
	};

	if (currentScreen === "entrance") {
		return <Entrance onStartGame={handleStartGame} />;
	}

	return (
		<div className="game-container">
			<div className="game-header">
				<h1>Geister</h1>
				<div className="game-controls">
					<button
						type="button"
						onClick={handleBackToEntrance}
						className="back-button"
					>
						Back to Menu
					</button>
					<button type="button" onClick={resetGame} className="reset-button">
						New Game
					</button>
				</div>
			</div>
			<div className="game-info">
				<p>Current Player: {gameState.currentPlayer}</p>
				{gameState.selectedPiece && (
					<p>Selected: {gameState.selectedPiece.color} ghost</p>
				)}
			</div>
			<Board
				gameState={gameState}
				onCellClick={handleCellClick}
				onGhostClick={handleGhostClick}
				onGhostMove={handleGhostMove}
			/>
		</div>
	);
}

export default App;
