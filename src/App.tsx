import { useState } from "react";
import { Board } from "./components/Board/Board";
import { Entrance } from "./components/Entrance/Entrance";
import { GhostSetup } from "./components/GhostSetup/GhostSetup";
import { useGameState } from "./hooks/useGameState";
import "./App.css";

type GameScreen = "entrance" | "game";

function App() {
	const [currentScreen, setCurrentScreen] = useState<GameScreen>("entrance");
	const {
		gameState,
		isAiThinking,
		winner,
		winCondition,
		handleCellClick,
		handleGhostClick,
		handleGhostMove,
		handlePlaceGhost,
		handleStartGamePhase,
		resetGame,
	} = useGameState();

	const handleStartGame = () => {
		resetGame();
		setCurrentScreen("game");
	};

	const handleBackToEntrance = () => {
		setCurrentScreen("entrance");
	};

	if (currentScreen === "entrance") {
		return <Entrance onStartGame={handleStartGame} />;
	}

	// Show setup screen when game is in setup phase
	if (gameState.gamePhase === "setup") {
		return (
			<div className="game-container">
				<div className="game-header">
					<h1>Geister - Setup</h1>
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
				<GhostSetup
					gameState={gameState}
					onPlaceGhost={handlePlaceGhost}
					onStartGame={handleStartGamePhase}
				/>
			</div>
		);
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
				{isAiThinking && <p>AI is thinking...</p>}
				{gameState.selectedPiece && (
					<p>Selected: {gameState.selectedPiece.color} ghost</p>
				)}
				{gameState.capturedGhosts.length > 0 && (
					<div className="captured-ghosts">
						<h3>Captured Ghosts:</h3>
						<div className="captured-list">
							{gameState.capturedGhosts.map((ghost) => (
								<span
									key={ghost.id}
									className={`captured-ghost ${
										ghost.isRevealed
											? `captured-ghost--${ghost.color}`
											: "captured-ghost--unknown"
									}`}
								>
									{ghost.isRevealed ? ghost.color : "?"} ({ghost.owner})
								</span>
							))}
						</div>
					</div>
				)}
			</div>
			<Board
				gameState={gameState}
				onCellClick={handleCellClick}
				onGhostClick={handleGhostClick}
				onGhostMove={handleGhostMove}
			/>
			{winner && (
				<div className="game-result-modal">
					<div className="game-result-content">
						<h2 className="game-result-title">
							{winner === "player" ? "You Win!" : "You Lose!"}
						</h2>
						<p className="game-result-description">
							{winCondition === "capture_all_blue" &&
								"All blue ghosts were captured!"}
							{winCondition === "lose_all_red" && "All red ghosts were lost!"}
							{winCondition === "escape" && `A blue ghost escaped to the goal!`}
						</p>
						<div className="game-result-actions">
							<button
								type="button"
								onClick={resetGame}
								className="play-again-button"
							>
								Play Again
							</button>
							<button
								type="button"
								onClick={handleBackToEntrance}
								className="back-to-menu-button"
							>
								Back to Menu
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
