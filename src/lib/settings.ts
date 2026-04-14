// Persisted extension settings. Stored in chrome.storage.local so they sync
// across popup/options views within the same browser profile.

import { storage } from "./browser";
import { DEFAULT_ENDPOINT } from "./endpoint";

export type SendMode = "createChild" | "attachToActive";

export interface Settings {
	apiKey: string;
	endpoint: string;
	mode: SendMode;
	activateAfterSend: boolean;
	trimQueryParams: boolean;
}

const DEFAULTS: Settings = {
	apiKey: "",
	endpoint: DEFAULT_ENDPOINT,
	mode: "createChild",
	activateAfterSend: true,
	trimQueryParams: false,
};

const KEYS: (keyof Settings)[] = [
	"apiKey",
	"endpoint",
	"mode",
	"activateAfterSend",
	"trimQueryParams",
];

export async function getSettings(): Promise<Settings> {
	const stored = await storage.get(KEYS);
	return {
		apiKey: typeof stored.apiKey === "string" ? stored.apiKey : DEFAULTS.apiKey,
		endpoint:
			typeof stored.endpoint === "string" && stored.endpoint.length > 0
				? stored.endpoint
				: DEFAULTS.endpoint,
		mode: stored.mode === "attachToActive" ? "attachToActive" : DEFAULTS.mode,
		activateAfterSend:
			typeof stored.activateAfterSend === "boolean"
				? stored.activateAfterSend
				: DEFAULTS.activateAfterSend,
		trimQueryParams:
			typeof stored.trimQueryParams === "boolean"
				? stored.trimQueryParams
				: DEFAULTS.trimQueryParams,
	};
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
	await storage.set(patch);
}
