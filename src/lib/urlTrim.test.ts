import { describe, it, expect } from "vitest";
import { hasQueryOrHash, stripQueryAndHash } from "./urlTrim";

describe("hasQueryOrHash", () => {
	it("detects query strings", () => {
		expect(hasQueryOrHash("https://example.com/p?utm_source=x")).toBe(true);
	});

	it("detects fragments", () => {
		expect(hasQueryOrHash("https://example.com/p#section")).toBe(true);
	});

	it("returns false for plain URLs", () => {
		expect(hasQueryOrHash("https://example.com/p")).toBe(false);
	});

	it("returns false for invalid URLs", () => {
		expect(hasQueryOrHash("not a url")).toBe(false);
	});
});

describe("stripQueryAndHash", () => {
	it("strips query parameters", () => {
		expect(stripQueryAndHash("https://example.com/p?x=1&y=2")).toBe(
			"https://example.com/p",
		);
	});

	it("strips fragments", () => {
		expect(stripQueryAndHash("https://example.com/p#section")).toBe(
			"https://example.com/p",
		);
	});

	it("strips both", () => {
		expect(stripQueryAndHash("https://example.com/p?a=b#frag")).toBe(
			"https://example.com/p",
		);
	});

	it("leaves clean URLs alone", () => {
		expect(stripQueryAndHash("https://example.com/p")).toBe("https://example.com/p");
	});

	it("returns invalid URLs unchanged", () => {
		expect(stripQueryAndHash("not a url")).toBe("not a url");
	});
});
