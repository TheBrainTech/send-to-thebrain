import {
	ApiError,
	InvalidKeyError,
	NotRunningError,
	UserMismatchError,
} from "./errors";
import { normalizeEndpoint } from "../lib/endpoint";
import type {
	AppState,
	Attachment,
	Brain,
	CreateThoughtRequest,
	CreateThoughtResponse,
	Thought,
} from "./types";
import { AcType, AttachmentType, LinkRelation, ThoughtKind } from "./types";

export interface TheBrainLocalClientOptions {
	apiKey: string;
	/** Either the bare server origin (`http://localhost:52341`) or the URL shown
	 *  in the desktop app's Local API widget (`http://localhost:52341/api/`). */
	endpoint: string;
}

export class TheBrainLocalClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;

	constructor({ apiKey, endpoint }: TheBrainLocalClientOptions) {
		this.apiKey = apiKey;
		this.baseUrl = normalizeEndpoint(endpoint);
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
	): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		const headers: Record<string, string> = {
			Authorization: `Bearer ${this.apiKey}`,
		};
		const init: RequestInit = { method, headers };
		if(body !== undefined) {
			headers["Content-Type"] = "application/json";
			init.body = JSON.stringify(body);
		}

		let response: Response;
		try {
			response = await fetch(url, init);
		} catch {
			// TypeError from fetch when the local server isn't reachable.
			throw new NotRunningError();
		}

		if(response.status === 401) {
			throw new InvalidKeyError();
		}
		if(response.status === 403) {
			throw new UserMismatchError();
		}
		if(!response.ok) {
			const text = await safeReadText(response);
			throw new ApiError(response.status, text || response.statusText);
		}

		if(response.status === 204) {
			return undefined as T;
		}
		const contentType = response.headers.get("content-type") ?? "";
		if(!contentType.includes("application/json")) {
			// Some endpoints return 200 OK with empty body.
			return undefined as T;
		}
		return (await response.json()) as T;
	}

	// --- App control (local API only) --------------------------------------

	getAppState(): Promise<AppState> {
		return this.request<AppState>("GET", "/api/app/state");
	}

	activateThought(brainId: string, thoughtId: string): Promise<void> {
		return this.request<void>(
			"POST",
			`/api/app/brain/${brainId}/thought/${thoughtId}/activate`,
		);
	}

	// --- Shared API (also available on the cloud API) ----------------------

	getBrains(): Promise<Brain[]> {
		return this.request<Brain[]>("GET", "/api/brains");
	}

	getThought(brainId: string, thoughtId: string): Promise<Thought> {
		return this.request<Thought>("GET", `/api/thoughts/${brainId}/${thoughtId}`);
	}

	findAttachmentsByLocation(
		brainId: string,
		location: string,
		type: AttachmentType = AttachmentType.ExternalUrl,
	): Promise<Attachment[]> {
		const params = new URLSearchParams({
			location,
			type: String(type),
		});
		return this.request<Attachment[]>(
			"GET",
			`/api/attachments/${brainId}/by-location?${params.toString()}`,
		);
	}

	createChildThought(
		brainId: string,
		parentThoughtId: string,
		name: string,
		label: string,
	): Promise<CreateThoughtResponse> {
		const body: CreateThoughtRequest = {
			name,
			label: label.length > 0 ? label : null,
			sourceThoughtId: parentThoughtId,
			relation: LinkRelation.Child,
			kind: ThoughtKind.Normal,
			typeId: null,
			acType: AcType.Public,
		};
		return this.request<CreateThoughtResponse>(
			"POST",
			`/api/thoughts/${brainId}`,
			body,
		);
	}

	attachUrl(
		brainId: string,
		thoughtId: string,
		url: string,
		name: string,
	): Promise<void> {
		const params = new URLSearchParams({ url, name });
		return this.request<void>(
			"POST",
			`/api/attachments/${brainId}/${thoughtId}/url?${params.toString()}`,
		);
	}
}

async function safeReadText(response: Response): Promise<string> {
	try {
		return await response.text();
	} catch {
		return "";
	}
}
