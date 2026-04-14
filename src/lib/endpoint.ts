// Normalizes whatever the user pastes in the "API endpoint" field so the
// client can build URLs against it. The desktop app's settings widget shows a
// URL like `http://localhost:52341/api/`, but we also want to accept
// `http://localhost:52341` or `http://localhost:52341/api` without making the
// user trim by hand.

export const DEFAULT_ENDPOINT = "http://localhost:5000/api/";

export function normalizeEndpoint(raw: string): string {
	const trimmed = raw.trim();
	if(trimmed.length === 0) {
		return "";
	}
	const hasScheme = /^https?:\/\//i.test(trimmed);
	const input = hasScheme ? trimmed : `http://${trimmed}`;
	let url: URL;
	try {
		url = new URL(input);
	} catch {
		return trimmed;
	}
	let path = url.pathname.replace(/\/+$/, "");
	if(path.toLowerCase().endsWith("/api")) {
		path = path.slice(0, -"/api".length);
	}
	return `${url.origin}${path}`;
}

export function isValidEndpoint(raw: string): boolean {
	const normalized = normalizeEndpoint(raw);
	if(!normalized) return false;
	try {
		const url = new URL(normalized);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}
