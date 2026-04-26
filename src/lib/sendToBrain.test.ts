import { describe, expect, it, vi } from "vitest";
import type { TheBrainLocalClient } from "../api/TheBrainLocalClient";
import { sendToBrain } from "./sendToBrain";

const appState = {
	currentBrainId: "brain-1",
	currentBrainName: "Brain",
	activeThoughtId: "active-1",
	activeThoughtName: "Active",
	isLoggedIn: true,
	userId: "user-1",
	tabs: [],
};

function createClient(): TheBrainLocalClient {
	return {
		getAppState: vi.fn().mockResolvedValue(appState),
		findAttachmentsByLocation: vi.fn().mockResolvedValue([]),
		createChildThought: vi.fn().mockResolvedValue({ id: "created-1" }),
		attachUrl: vi.fn().mockResolvedValue(undefined),
		activateThought: vi.fn().mockResolvedValue(undefined),
	} as unknown as TheBrainLocalClient;
}

describe("sendToBrain", () => {
	it("creates a child under the selected target thought", async () => {
		const client = createClient();

		await sendToBrain({
			client,
			tabTitle: "Example | Site",
			tabUrl: "https://example.com",
			mode: "createChild",
			targetThought: { id: "pin-1", name: "Pinned Project" },
			activateAfterSend: false,
		});

		expect(client.createChildThought).toHaveBeenCalledWith(
			"brain-1",
			{ id: "pin-1", name: "Pinned Project" },
			"Example",
			"Site",
		);
	});

	it("attaches the URL to the selected target thought", async () => {
		const client = createClient();

		const outcome = await sendToBrain({
			client,
			tabTitle: "Example",
			tabUrl: "https://example.com",
			mode: "attachToActive",
			targetThought: { id: "pin-1", name: "Pinned Project" },
			activateAfterSend: false,
		});

		expect(client.attachUrl).toHaveBeenCalledWith(
			"brain-1",
			"pin-1",
			"https://example.com",
			"Example",
		);
		expect(outcome).toMatchObject({
			kind: "attached",
			thoughtId: "pin-1",
			thoughtName: "Pinned Project",
		});
	});
});
