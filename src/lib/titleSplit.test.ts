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

	it("strips leading unread-count prefix like (19)", () => {
		expect(splitTitle("(19) My Prodigal Brainchild - Neal Stephenson")).toEqual({
			name: "My Prodigal Brainchild",
			label: "Neal Stephenson",
		});
	});

	it("strips unread-count prefix when there is no other splitter", () => {
		expect(splitTitle("(20) YouTube")).toEqual({
			name: "YouTube",
			label: "",
		});
	});

	it("leaves parenthesized non-numeric prefixes alone", () => {
		expect(splitTitle("(Draft) My Post - My Blog")).toEqual({
			name: "(Draft) My Post",
			label: "My Blog",
		});
	});
});
