import { describe, it, expect } from "vitest";
import { normalizeEndpoint, isValidEndpoint } from "./endpoint";

describe("normalizeEndpoint", () => {
	it("accepts the URL format shown in the desktop widget", () => {
		expect(normalizeEndpoint("http://localhost:52341/api/")).toBe("http://localhost:52341");
	});

	it("accepts the URL without trailing slash", () => {
		expect(normalizeEndpoint("http://localhost:52341/api")).toBe("http://localhost:52341");
	});

	it("accepts a bare origin", () => {
		expect(normalizeEndpoint("http://localhost:52341")).toBe("http://localhost:52341");
	});

	it("adds http:// when scheme is missing", () => {
		expect(normalizeEndpoint("localhost:52341/api/")).toBe("http://localhost:52341");
	});

	it("preserves https", () => {
		expect(normalizeEndpoint("https://localhost:5001/api/")).toBe("https://localhost:5001");
	});

	it("trims whitespace", () => {
		expect(normalizeEndpoint("  http://localhost:5000/api/  ")).toBe("http://localhost:5000");
	});

	it("leaves unrelated trailing paths alone", () => {
		expect(normalizeEndpoint("http://example.com/custom/")).toBe("http://example.com/custom");
	});
});

describe("isValidEndpoint", () => {
	it("accepts http and https URLs", () => {
		expect(isValidEndpoint("http://localhost:5000")).toBe(true);
		expect(isValidEndpoint("https://localhost:5001/api/")).toBe(true);
	});

	it("rejects empty input", () => {
		expect(isValidEndpoint("")).toBe(false);
		expect(isValidEndpoint("   ")).toBe(false);
	});
});
