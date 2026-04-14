import { describe, it, expect } from "vitest";
import { splitTitle, trimTitleMetadata, getTitleMetadata } from "./titleSplit";

describe("splitTitle", () => {
	it("splits pipe-separated titles", () => {
		expect(splitTitle("Apple Inc | Wikipedia")).toEqual({
			name: "Apple Inc",
			label: "Wikipedia",
		});
	});

	it("splits em-dash-separated titles", () => {
		expect(splitTitle("Getting Started \u2014 TheBrain")).toEqual({
			name: "Getting Started",
			label: "TheBrain",
		});
	});

	it("splits dash-separated titles", () => {
		expect(splitTitle("My Post - My Blog")).toEqual({
			name: "My Post",
			label: "My Blog",
		});
	});

	it("handles reverse colon splitter when no other splitter matches", () => {
		expect(splitTitle("Home: The Best Place")).toEqual({
			name: "The Best Place",
			label: "Home",
		});
	});

	it("returns the whole title with empty label when no splitter matches", () => {
		expect(splitTitle("Python")).toEqual({
			name: "Python",
			label: "",
		});
	});

	it("normalizes non-breaking spaces before splitting", () => {
		expect(splitTitle("Story\u00A0|\u00A0Site")).toEqual({
			name: "Story",
			label: "Site",
		});
	});

	it("trims whitespace from both parts", () => {
		expect(splitTitle("  Padded  |  Side  ")).toEqual({
			name: "Padded",
			label: "Side",
		});
	});

	it("exposes trimTitleMetadata and getTitleMetadata separately", () => {
		expect(trimTitleMetadata("X | Y")).toBe("X");
		expect(getTitleMetadata("X | Y")).toBe("Y");
	});
});
