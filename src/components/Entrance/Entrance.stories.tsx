import type { Meta, StoryObj } from "@storybook/react-vite";
import { Entrance } from "./Entrance";

const meta: Meta<typeof Entrance> = {
	title: "Components/Entrance",
	component: Entrance,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"The entrance screen component that welcomes players and provides game start functionality with a beautiful background image.",
			},
		},
	},
	argTypes: {
		onStartGame: {
			description:
				"Callback function triggered when the start game button is clicked",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Entrance>;

export const Default: Story = {
	args: {
		onStartGame: () => console.log("Start game clicked"),
	},
};
