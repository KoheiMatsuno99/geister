import { describe, expect, it, vi } from "vitest";
import { RulesModal } from "./RulesModal";

describe("RulesModal", () => {
	it("should not render when isOpen is false", () => {
		const onClose = vi.fn();
		const result = RulesModal({ isOpen: false, onClose });
		expect(result).toBeNull();
	});

	it("should render modal with correct structure when isOpen is true", () => {
		const onClose = vi.fn();
		const result = RulesModal({ isOpen: true, onClose });

		expect(result).toBeTruthy();
		expect(result?.props.className).toBe("rules-modal-overlay");
		expect(result?.props.role).toBe("dialog");
		expect(result?.props["aria-modal"]).toBe("true");
	});

	it("should call onClose when escape key is pressed", () => {
		const onClose = vi.fn();
		const result = RulesModal({ isOpen: true, onClose });

		const keyDownEvent = { key: "Escape" };
		result?.props.onKeyDown(keyDownEvent);

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("should not call onClose when other key is pressed", () => {
		const onClose = vi.fn();
		const result = RulesModal({ isOpen: true, onClose });

		const keyDownEvent = { key: "Enter" };
		result?.props.onKeyDown(keyDownEvent);

		expect(onClose).not.toHaveBeenCalled();
	});

	it("should call onClose when overlay is clicked", () => {
		const onClose = vi.fn();
		const result = RulesModal({ isOpen: true, onClose });

		const clickEvent = { target: result, currentTarget: result };
		result?.props.onClick(clickEvent);

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("should not call onClose when content is clicked", () => {
		const onClose = vi.fn();
		const result = RulesModal({ isOpen: true, onClose });

		const clickEvent = { target: {}, currentTarget: result };
		result?.props.onClick(clickEvent);

		expect(onClose).not.toHaveBeenCalled();
	});
});
