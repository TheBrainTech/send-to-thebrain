import { describe, it, expect, vi } from "vitest";
import {
	buildCandidates,
	discoverEndpoint,
	portFromEndpoint,
	DEFAULT_FALLBACK_PORTS,
} from "./portDiscovery";

describe("portFromEndpoint", () => {
	it("extracts the port from a normalized endpoint", () => {
		expect(portFromEndpoint("http://localhost:52341")).toBe(52341);
	});
	it("works with the trailing /api form", () => {
		expect(portFromEndpoint("http://localhost:8001/api/")).toBe(8001);
	});
	it("returns null when no explicit port is present", () => {
		expect(portFromEndpoint("http://localhost/api")).toBeNull();
	});
	it("returns null for unparseable input", () => {
		expect(portFromEndpoint("not a url")).toBeNull();
	});
});

describe("buildCandidates", () => {
	it("starts with the current endpoint, then MRU, then fallbacks", () => {
		const out = buildCandidates("http://localhost:52341/api/", [8001, 9000]);
		const ports = out.map((c) => c.port);
		expect(ports[0]).toBe(52341);
		expect(ports.slice(1, 3)).toEqual([8001, 9000]);
		// Defaults follow, with 8001 already deduped.
		expect(ports).toContain(DEFAULT_FALLBACK_PORTS[1]);
	});
	it("dedupes when the current port is also in the MRU", () => {
		const out = buildCandidates("http://localhost:52341", [52341, 8001]);
		const ports = out.map((c) => c.port);
		expect(ports.filter((p) => p === 52341)).toHaveLength(1);
		expect(ports[0]).toBe(52341);
		expect(ports[1]).toBe(8001);
	});
	it("falls back to defaults when nothing else is known", () => {
		const out = buildCandidates("", []);
		expect(out.map((c) => c.port)).toEqual([...DEFAULT_FALLBACK_PORTS]);
	});
	it("ignores invalid ports", () => {
		const out = buildCandidates("http://localhost:99999", [-1, 0, 70000]);
		expect(out.every((c) => c.port > 0 && c.port < 65536)).toBe(true);
	});
});

describe("discoverEndpoint", () => {
	it("returns the first ok candidate in candidate order", async () => {
		const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if(url.startsWith("http://localhost:8001/")) {
				return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
			}
			if(url.startsWith("http://localhost:9000/")) {
				return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
			}
			throw new TypeError("connection refused");
		});
		const result = await discoverEndpoint({
			apiKey: "k",
			candidates: [
				{ origin: "http://localhost:52341", port: 52341 },
				{ origin: "http://localhost:8001", port: 8001 },
				{ origin: "http://localhost:9000", port: 9000 },
			],
			timeoutMs: 100,
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});
		expect(result.winner?.port).toBe(8001);
		expect(result.all).toHaveLength(3);
	});

	it("reports auth when the port responds with 401 but no port is OK", async () => {
		const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if(url.startsWith("http://localhost:52341/")) {
				return new Response("nope", { status: 401 });
			}
			throw new TypeError("connection refused");
		});
		const result = await discoverEndpoint({
			apiKey: "k",
			candidates: [
				{ origin: "http://localhost:8001", port: 8001 },
				{ origin: "http://localhost:52341", port: 52341 },
			],
			timeoutMs: 100,
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});
		expect(result.winner).toBeNull();
		expect(result.all.some((r) => r.kind === "auth" && r.port === 52341)).toBe(true);
	});

	it("returns null winner when every probe fails", async () => {
		const fetchImpl = vi.fn(async () => {
			throw new TypeError("connection refused");
		});
		const result = await discoverEndpoint({
			apiKey: "k",
			candidates: [
				{ origin: "http://localhost:8001", port: 8001 },
				{ origin: "http://localhost:9000", port: 9000 },
			],
			timeoutMs: 100,
			fetchImpl: fetchImpl as unknown as typeof fetch,
		});
		expect(result.winner).toBeNull();
		expect(result.all.every((r) => r.kind === "no")).toBe(true);
	});

	it("handles an empty candidate list", async () => {
		const result = await discoverEndpoint({
			apiKey: "k",
			candidates: [],
			fetchImpl: vi.fn() as unknown as typeof fetch,
		});
		expect(result.winner).toBeNull();
		expect(result.all).toEqual([]);
	});
});
