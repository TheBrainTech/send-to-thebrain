// Probe localhost ports in parallel to find the one TheBrain's desktop app
// is currently listening on. Browser extensions can't enumerate processes
// (no equivalent of `Get-NetTCPConnection`), so the only signal available
// is "does an HTTP request to localhost:<port>/api/app/state succeed".

import { normalizeEndpoint } from "./endpoint";

/** Origin to probe and the port we extracted from it (handy for callers
 *  that want to record a successful port in the MRU list). */
export interface PortCandidate {
	origin: string;
	port: number;
}

/** Outcome for a single probe. `ok` means "TheBrain answered"; `auth` means
 *  the port has a TheBrain instance but the saved API key was rejected
 *  (probably stale). `no` means nothing usable on that port. */
export type ProbeResult =
	| { kind: "ok"; origin: string; port: number }
	| { kind: "auth"; origin: string; port: number }
	| { kind: "no"; origin: string; port: number };

export interface DiscoveryOptions {
	apiKey: string;
	candidates: PortCandidate[];
	/** Per-probe timeout in ms. Total wall time is bounded by this because
	 *  all probes run in parallel. Default 700ms keeps the popup snappy. */
	timeoutMs?: number;
	/** Injected for tests. Falls back to global fetch. */
	fetchImpl?: typeof fetch;
}

export interface DiscoveryResult {
	/** First "ok" probe — the endpoint to use. Null if none answered. */
	winner: ProbeResult | null;
	/** All results, in the order they settled. Useful for diagnostics
	 *  (e.g. to surface "key was rejected on port X" if no ok). */
	all: ProbeResult[];
}

const DEFAULT_PROBE_TIMEOUT_MS = 700;
// Default ports to try when the user has no history yet. 8001 is the
// observed default for self-hosted local APIs; 52341 is what TheBrain's
// desktop widget often shows; 8081 is a frequent collision-avoidance pick.
export const DEFAULT_FALLBACK_PORTS: readonly number[] = [8001, 52341, 8081];

/** Build the candidate list from settings + defaults, deduplicating while
 *  preserving order: current endpoint first, then MRU history, then
 *  hard-coded fallbacks. */
export function buildCandidates(
	currentEndpoint: string,
	recentPorts: readonly number[],
	fallbacks: readonly number[] = DEFAULT_FALLBACK_PORTS,
): PortCandidate[] {
	const seen = new Set<number>();
	const out: PortCandidate[] = [];
	const add = (port: number) => {
		if(!Number.isInteger(port) || port <= 0 || port >= 65536) return;
		if(seen.has(port)) return;
		seen.add(port);
		out.push({ origin: `http://localhost:${port}`, port });
	};
	const currentPort = portFromEndpoint(currentEndpoint);
	if(currentPort !== null) add(currentPort);
	for(const p of recentPorts) add(p);
	for(const p of fallbacks) add(p);
	return out;
}

/** Pull the port out of an endpoint string. Returns null if the string
 *  isn't a parseable URL or has no explicit port. */
export function portFromEndpoint(endpoint: string): number | null {
	const normalized = normalizeEndpoint(endpoint);
	if(!normalized) return null;
	try {
		const url = new URL(normalized);
		if(!url.port) return null;
		const n = Number(url.port);
		return Number.isInteger(n) && n > 0 && n < 65536 ? n : null;
	} catch {
		return null;
	}
}

/** Probe every candidate in parallel. Resolves once all probes have
 *  settled (success, failure, or timeout). The caller gets the first
 *  "ok" result if any; otherwise can inspect `all` for "auth" hits. */
export async function discoverEndpoint(opts: DiscoveryOptions): Promise<DiscoveryResult> {
	const { apiKey, candidates } = opts;
	const timeoutMs = opts.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
	const fetchImpl = opts.fetchImpl ?? fetch;

	if(candidates.length === 0) {
		return { winner: null, all: [] };
	}

	const probes = candidates.map((c) => probeOne(c, apiKey, timeoutMs, fetchImpl));
	const all = await Promise.all(probes);
	// Pick winner in candidate order so "current endpoint" or top of MRU
	// wins ties — this is the user's expected behavior, not "whichever
	// race we won by 2ms".
	const winner = all.find((r) => r.kind === "ok") ?? null;
	return { winner, all };
}

async function probeOne(
	candidate: PortCandidate,
	apiKey: string,
	timeoutMs: number,
	fetchImpl: typeof fetch,
): Promise<ProbeResult> {
	const url = `${candidate.origin}/api/app/state`;
	try {
		const response = await fetchImpl(url, {
			method: "GET",
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: AbortSignal.timeout(timeoutMs),
		});
		if(response.ok) {
			return { kind: "ok", origin: candidate.origin, port: candidate.port };
		}
		if(response.status === 401 || response.status === 403) {
			return { kind: "auth", origin: candidate.origin, port: candidate.port };
		}
		return { kind: "no", origin: candidate.origin, port: candidate.port };
	} catch {
		// Connection refused / RST / our timeout fired.
		return { kind: "no", origin: candidate.origin, port: candidate.port };
	}
}
