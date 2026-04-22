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

// Returns true if `url`'s hostname matches any entry in `exceptions`.
// An entry matches the hostname itself or any subdomain of it (so
// "youtube.com" matches "m.youtube.com" and "music.youtube.com").
export function isTrimException(url: string, exceptions: readonly string[]): boolean {
	let host: string;
	try {
		host = new URL(url).hostname.toLowerCase();
	} catch {
		return false;
	}
	for(const entry of exceptions) {
		const e = entry.trim().toLowerCase();
		if(e.length === 0) continue;
		if(host === e || host.endsWith(`.${e}`)) {
			return true;
		}
	}
	return false;
}
