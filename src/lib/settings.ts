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
	// Hostnames where query params/fragments must be preserved even when
	// trimQueryParams is on, because the query carries page identity (e.g.
	// YouTube's ?v=VIDEO_ID). Entries are bare hostnames; subdomains match.
	trimQueryParamsExceptions: string[];
	autoProceed: boolean;
	// Most-recently-successful local API ports, MRU-ordered. Used by the
	// port-discovery probe to find TheBrain after the desktop app rotates
	// to a new port across sessions.
	recentPorts: number[];
}

export const AUTO_PROCEED_MS = 3000;

export const RECENT_PORTS_LIMIT = 8;

export const DEFAULT_TRIM_EXCEPTIONS: readonly string[] = [
	"youtube.com",
	"youtu.be",
];

const DEFAULTS: Settings = {
	apiKey: "",
	endpoint: DEFAULT_ENDPOINT,
	mode: "createChild",
	activateAfterSend: true,
	trimQueryParams: false,
	trimQueryParamsExceptions: [...DEFAULT_TRIM_EXCEPTIONS],
	autoProceed: false,
	recentPorts: [],
};

const KEYS: (keyof Settings)[] = [
	"apiKey",
	"endpoint",
	"mode",
	"activateAfterSend",
	"trimQueryParams",
	"trimQueryParamsExceptions",
	"autoProceed",
	"recentPorts",
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
		trimQueryParamsExceptions: Array.isArray(stored.trimQueryParamsExceptions)
			? (stored.trimQueryParamsExceptions as unknown[]).filter(
					(v): v is string => typeof v === "string",
				)
			: [...DEFAULTS.trimQueryParamsExceptions],
		autoProceed:
			typeof stored.autoProceed === "boolean"
				? stored.autoProceed
				: DEFAULTS.autoProceed,
		recentPorts: Array.isArray(stored.recentPorts)
			? (stored.recentPorts as unknown[])
					.filter(
						(v): v is number =>
							typeof v === "number" &&
							Number.isInteger(v) &&
							v > 0 &&
							v < 65536,
					)
					.slice(0, RECENT_PORTS_LIMIT)
			: [...DEFAULTS.recentPorts],
	};
}

// Push a port to the front of the recent-ports MRU list, deduping and
// capping the length. Returns the new list (not persisted — the caller
// passes it to updateSettings).
export function pushRecentPort(existing: number[], port: number): number[] {
	const filtered = existing.filter((p) => p !== port);
	return [port, ...filtered].slice(0, RECENT_PORTS_LIMIT);
}

// Parse a free-form list (newlines or commas) into normalized hostnames.
// Strips scheme/path/whitespace and lowercases. Used by the options UI.
export function parseExceptionList(input: string): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for(const raw of input.split(/[\s,]+/)) {
		const trimmed = raw.trim().toLowerCase();
		if(trimmed.length === 0) continue;
		// Tolerate users pasting full URLs.
		let host = trimmed;
		try {
			const withScheme = /^[a-z]+:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`;
			host = new URL(withScheme).hostname;
		} catch {
			// Fall back to the raw token.
		}
		if(host.length === 0 || seen.has(host)) continue;
		seen.add(host);
		out.push(host);
	}
	return out;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
	await storage.set(patch);
}
