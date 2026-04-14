// Orchestrates the "save this page" workflow end-to-end. Split out of the
// popup component so the logic is testable in isolation and reusable if we
// later add a keyboard-shortcut or context-menu entry point.

import { TheBrainLocalClient } from "../api/TheBrainLocalClient";
import {
	NoBrainOpenError,
	ReadOnlyBrainError,
	ApiError,
	TheBrainError,
} from "../api/errors";
import type { AppState } from "../api/types";
import type { SendMode } from "./settings";
import { splitTitle } from "./titleSplit";

export interface SendInput {
	client: TheBrainLocalClient;
	tabTitle: string;
	tabUrl: string;
	mode: SendMode;
	activateAfterSend: boolean;
}

export type SendOutcome =
	| {
			kind: "created";
			brainId: string;
			thoughtId: string;
			thoughtName: string;
			label: string;
	  }
	| {
			kind: "attached";
			brainId: string;
			thoughtId: string;
			thoughtName: string;
	  }
	| {
			kind: "alreadyExists";
			brainId: string;
			thoughtId: string;
			thoughtName: string;
	  };

export async function sendToBrain(input: SendInput): Promise<SendOutcome> {
	const { client, tabTitle, tabUrl, mode, activateAfterSend } = input;

	const state = await client.getAppState();
	if(!state.currentBrainId || !state.activeThoughtId) {
		throw new NoBrainOpenError();
	}

	const existing = await findExistingThoughtWithUrl(client, state, tabUrl);
	if(existing) {
		if(activateAfterSend) {
			await client.activateThought(state.currentBrainId, existing.thoughtId);
		}
		return {
			kind: "alreadyExists",
			brainId: state.currentBrainId,
			thoughtId: existing.thoughtId,
			thoughtName: existing.thoughtName,
		};
	}

	const { name, label } = splitTitle(tabTitle);
	const effectiveName = name.length > 0 ? name : tabUrl;
	const attachmentName = tabTitle.trim().length > 0 ? tabTitle.trim() : tabUrl;

	try {
		if(mode === "createChild") {
			const created = await client.createChildThought(
				state.currentBrainId,
				state.activeThoughtId,
				effectiveName,
				label,
			);
			await client.attachUrl(
				state.currentBrainId,
				created.id,
				tabUrl,
				attachmentName,
			);
			if(activateAfterSend) {
				await client.activateThought(state.currentBrainId, created.id);
			}
			return {
				kind: "created",
				brainId: state.currentBrainId,
				thoughtId: created.id,
				thoughtName: effectiveName,
				label,
			};
		}

		// attachToActive
		await client.attachUrl(
			state.currentBrainId,
			state.activeThoughtId,
			tabUrl,
			attachmentName,
		);
		return {
			kind: "attached",
			brainId: state.currentBrainId,
			thoughtId: state.activeThoughtId,
			thoughtName: state.activeThoughtName ?? "active thought",
		};
	} catch(error) {
		// Auth and user-mismatch have already been filtered out in the client.
		// A 400/403 here means the target brain rejected the write.
		if(error instanceof ApiError && (error.status === 400 || error.status === 403)) {
			throw new ReadOnlyBrainError();
		}
		throw error;
	}
}

interface ExistingHit {
	thoughtId: string;
	thoughtName: string;
}

async function findExistingThoughtWithUrl(
	client: TheBrainLocalClient,
	state: AppState,
	url: string,
): Promise<ExistingHit | null> {
	if(!state.currentBrainId) {
		return null;
	}
	let attachments;
	try {
		attachments = await client.findAttachmentsByLocation(state.currentBrainId, url);
	} catch(error) {
		if(error instanceof ApiError && error.status === 404) {
			console.warn(
				"[Send to TheBrain] by-location endpoint returned 404. " +
				"The desktop app probably needs a rebuild to include the new API route — " +
				"duplicate detection will be skipped until then.",
			);
			return null;
		}
		if(error instanceof TheBrainError) {
			console.warn("[Send to TheBrain] duplicate-detection lookup failed:", error);
			return null;
		}
		throw error;
	}
	console.debug("[Send to TheBrain] dedupe query", { url, attachments });
	// sourceType 2 = Thought (per Attachment.EntityType in TheBrainNetCore).
	const hit = attachments.find((a) => a.sourceType === 2);
	if(!hit) {
		return null;
	}
	let thoughtName = hit.name ?? "existing thought";
	try {
		const thought = await client.getThought(state.currentBrainId, hit.sourceId);
		thoughtName = thought.name;
	} catch {
		// Fall back to the attachment name if the thought fetch fails.
	}
	return { thoughtId: hit.sourceId, thoughtName };
}
