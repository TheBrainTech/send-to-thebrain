// Helpers for the "trim query parameters" popup checkbox.
// Kept separate so the logic is testable without pulling in browser APIs.

export function hasQueryOrHash(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.search.length > 0 || parsed.hash.length > 0;
	} catch {
		return false;
	}
}

export function stripQueryAndHash(url: string): string {
	try {
		const parsed = new URL(url);
		parsed.search = "";
		parsed.hash = "";
		return parsed.toString();
	} catch {
		return url;
	}
}
