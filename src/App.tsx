import { useState } from "react";
import blueGhostImg from "./assets/blueGhost.jpeg";
import redGhostImg from "./assets/redGhost.jpeg";
import unknownGhostImg from "./assets/unknownGhost.jpeg";
import { Board } from "./components/Board/Board";
import { Entrance } from "./components/Entrance/Entrance";
import { GhostSetup } from "./components/GhostSetup/GhostSetup";
import { RulesModal } from "./components/RulesModal/RulesModal";
import { useGameState } from "./hooks/useGameState";
import type { Ghost } from "./types/game";
import "./App.css";

type GameScreen = "entrance" | "game";

interface CapturedGhostDisplayProps {
	ghost: Ghost;
	isPlayerCaptured: boolean;
}

const CapturedGhostDisplay = ({
	ghost,
	isPlayerCaptured,
}: CapturedGhostDisplayProps) => {
	const getGhostImage = () => {
		if (!ghost.isRevealed) {
			return unknownGhostImg;
		}
		return ghost.color === "blue" ? blueGhostImg : redGhostImg;
	};

	return (
		<div
			className={`captured-ghost-display ${isPlayerCaptured ? "captured-ghost-display--player" : "captured-ghost-display--computer"}`}
		>
			<img
				src={getGhostImage()}
				alt={ghost.isRevealed ? `${ghost.color} ghost` : "Unknown ghost"}
				className={`captured-ghost-image ${!isPlayerCaptured ? "captured-ghost-image--flipped" : ""}`}
			/>
		</div>
	);
};

function App() {
	const [currentScreen, setCurrentScreen] = useState<GameScreen>("entrance");
	const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
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

	// Separate captured ghosts by who captured them
	const playerCapturedGhosts = gameState.capturedGhosts.filter(
		(ghost) => ghost.owner === "computer",
	);
	const computerCapturedGhosts = gameState.capturedGhosts.filter(
		(ghost) => ghost.owner === "player",
	);

	const handleStartGame = () => {
		resetGame();
		setCurrentScreen("game");
	};

	const handleBackToEntrance = () => {
		setCurrentScreen("entrance");
	};

	const handleShowRules = () => {
		setIsRulesModalOpen(true);
	};

	const handleCloseRules = () => {
		setIsRulesModalOpen(false);
	};

	if (currentScreen === "entrance") {
		return (
			<>
				<Entrance onStartGame={handleStartGame} onShowRules={handleShowRules} />
				<RulesModal isOpen={isRulesModalOpen} onClose={handleCloseRules} />
			</>
		);
	}

	// Show setup screen when game is in setup phase
	if (gameState.gamePhase === "setup") {
		return (
			<>
				<div className="game-container">
					<div className="game-header">
						<h1>Geister - Setup</h1>
						<div className="game-controls">
							<button
								type="button"
								onClick={handleShowRules}
								className="rules-button"
							>
								Rules
							</button>
							<button
								type="button"
								onClick={handleBackToEntrance}
								className="back-button"
							>
								Back to Menu
							</button>
							<button
								type="button"
								onClick={resetGame}
								className="reset-button"
							>
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
				<RulesModal isOpen={isRulesModalOpen} onClose={handleCloseRules} />
			</>
		);
	}

	return (
		<>
			<div className="game-container">
				<div className="game-header">
					<h1>Geister</h1>
					<div className="game-controls">
						<button
							type="button"
							onClick={handleShowRules}
							className="rules-button"
						>
							Rules
						</button>
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
				</div>

				{/* Computer captured ghosts - displayed above the board */}
				<div className="captured-ghosts-top">
					{computerCapturedGhosts.map((ghost) => (
						<CapturedGhostDisplay
							key={ghost.id}
							ghost={ghost}
							isPlayerCaptured={false}
						/>
					))}
				</div>

				<Board
					gameState={gameState}
					onCellClick={handleCellClick}
					onGhostClick={handleGhostClick}
					onGhostMove={handleGhostMove}
				/>

				{/* Player captured ghosts - displayed below the board */}
				<div className="captured-ghosts-bottom">
					{playerCapturedGhosts.map((ghost) => (
						<CapturedGhostDisplay
							key={ghost.id}
							ghost={ghost}
							isPlayerCaptured={true}
						/>
					))}
				</div>
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
								{winCondition === "escape" &&
									`A blue ghost escaped to the goal!`}
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
			<RulesModal isOpen={isRulesModalOpen} onClose={handleCloseRules} />
		</>
	);
}

export default App;
