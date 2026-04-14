// Thin shim around the browser extension APIs we touch. Keeping this in one
// place makes the Safari / Firefox port a matter of swapping a single import.
// Firefox ships `browser.*` with promise-returning APIs; Chrome's `chrome.*`
// also returns promises in MV3, so we can keep the same surface.

type BrowserGlobal = typeof chrome;

function getApi(): BrowserGlobal {
	if(typeof chrome !== "undefined" && chrome?.storage) {
		return chrome;
	}
	// Firefox exposes this, Chrome doesn't.
	const maybeBrowser = (globalThis as { browser?: BrowserGlobal }).browser;
	if(maybeBrowser?.storage) {
		return maybeBrowser;
	}
	throw new Error("No extension APIs available in this context");
}

const api = getApi();

export interface ActiveTab {
	title: string;
	url: string;
}

export const tabs = {
	async getActive(): Promise<ActiveTab | null> {
		const results = await api.tabs.query({ active: true, currentWindow: true });
		const first = results[0];
		if(!first || !first.url) {
			return null;
		}
		return {
			title: first.title ?? "",
			url: first.url,
		};
	},
};

export const storage = {
	get(keys: string[]): Promise<Record<string, unknown>> {
		return api.storage.local.get(keys) as Promise<Record<string, unknown>>;
	},
	set(values: Record<string, unknown>): Promise<void> {
		return api.storage.local.set(values) as Promise<void>;
	},
};

export const runtime = {
	openOptionsPage(): Promise<void> {
		return api.runtime.openOptionsPage();
	},
};
