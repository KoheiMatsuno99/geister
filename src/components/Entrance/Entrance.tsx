import { memo } from "react";
import entranceImg from "../../assets/entrance.jpeg";
import "./Entrance.css";

export interface EntranceProps {
	onStartGame: () => void;
}

export const Entrance = memo(({ onStartGame }: EntranceProps) => {
	return (
		<div
			className="entrance"
			style={{ backgroundImage: `url(${entranceImg})` }}
		>
			<div className="entrance-overlay">
				<div className="entrance-content">
					<h1 className="entrance-title">Geister</h1>
					<p className="entrance-subtitle">Strategic Ghost Battle Game</p>
					<button
						type="button"
						className="entrance-start-button"
						onClick={onStartGame}
					>
						Start Game
					</button>
				</div>
			</div>
		</div>
	);
});

Entrance.displayName = "Entrance";
