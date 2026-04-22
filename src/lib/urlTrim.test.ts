import { describe, it, expect } from "vitest";
import { hasQueryOrHash, isTrimException, stripQueryAndHash } from "./urlTrim";

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

describe("isTrimException", () => {
	const list = ["youtube.com", "youtu.be"];

	it("matches exact hostname", () => {
		expect(isTrimException("https://youtube.com/watch?v=abc", list)).toBe(true);
	});

	it("matches subdomains", () => {
		expect(isTrimException("https://www.youtube.com/watch?v=abc", list)).toBe(true);
		expect(isTrimException("https://m.youtube.com/watch?v=abc", list)).toBe(true);
		expect(isTrimException("https://music.youtube.com/watch?v=abc", list)).toBe(true);
	});

	it("does not match unrelated hostnames", () => {
		expect(isTrimException("https://example.com/p", list)).toBe(false);
	});

	it("does not match hostnames that merely contain an entry as a substring", () => {
		expect(isTrimException("https://notyoutube.com/p", list)).toBe(false);
	});

	it("is case insensitive", () => {
		expect(isTrimException("https://WWW.YouTube.com/watch?v=abc", list)).toBe(true);
	});

	it("ignores blank entries", () => {
		expect(isTrimException("https://example.com/", ["", "   "])).toBe(false);
	});

	it("returns false for invalid URLs", () => {
		expect(isTrimException("not a url", list)).toBe(false);
	});
});
