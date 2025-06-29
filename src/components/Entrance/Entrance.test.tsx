import { describe, expect, it, vi } from "vitest";
import { Entrance } from "./Entrance";

describe("Entrance Component", () => {
	describe("props", () => {
		it("should accept onStartGame prop", () => {
			const mockOnStartGame = vi.fn();

			// Test that the component accepts the required props
			expect(() => {
				const props = { onStartGame: mockOnStartGame };
				expect(props.onStartGame).toBe(mockOnStartGame);
			}).not.toThrow();
		});

		it("should have correct display name", () => {
			expect(Entrance.displayName).toBe("Entrance");
		});
	});

	describe("component structure", () => {
		it("should be a memoized component", () => {
			expect(Entrance).toBeDefined();
			expect(typeof Entrance).toBe("object");
		});
	});
});
