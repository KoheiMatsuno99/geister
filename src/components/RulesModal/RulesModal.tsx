import "./RulesModal.css";

interface RulesModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const RulesModal = ({ isOpen, onClose }: RulesModalProps) => {
	if (!isOpen) return null;

	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	return (
		<div
			className="rules-modal-overlay"
			onClick={handleOverlayClick}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="rules-modal-title"
			tabIndex={-1}
		>
			<div className="rules-modal-content">
				<div className="rules-modal-header">
					<h2 id="rules-modal-title" className="rules-modal-title">
						ゲームルール
					</h2>
					<button
						type="button"
						className="rules-modal-close"
						onClick={onClose}
						aria-label="ルールを閉じる"
					>
						×
					</button>
				</div>

				<div className="rules-modal-body">
					<section className="rules-section">
						<h3>ゲームの目的</h3>
						<p>相手のゴーストを捕まえることです。</p>
					</section>

					<section className="rules-section">
						<h3>ゴーストについて</h3>
						<p>
							ゴーストは、赤と青の2色があります。ただし、相手のゴーストの種類は捕まえるまでわかりません。
						</p>
					</section>

					<section className="rules-section">
						<h3>脱出マス</h3>
						<p>
							各プレイヤーから見て相手側の角のマスは脱出マスとなっています。自分の青ゴーストが脱出マスに到達し、その次のターンで取られなければ、そのゴーストはボードから脱出します。
						</p>
					</section>

					<section className="rules-section">
						<h3>勝利条件</h3>
						<p>以下のどれかを満たすことで勝利します：</p>
						<ul>
							<li>相手の青ゴーストを全て取る</li>
							<li>自分の赤ゴーストを全て取らせる</li>
							<li>自分の青ゴーストを脱出させる</li>
						</ul>
					</section>

					<section className="rules-section">
						<h3>操作方法</h3>
						<p>
							ゴーストをクリックして選択し、移動したいマスをクリックして移動します。相手のゴーストがいるマスに移動すると、そのゴーストを捕まえることができます。
						</p>
					</section>
				</div>

				<div className="rules-modal-footer">
					<button
						type="button"
						className="rules-modal-button"
						onClick={onClose}
					>
						閉じる
					</button>
				</div>
			</div>
		</div>
	);
};
