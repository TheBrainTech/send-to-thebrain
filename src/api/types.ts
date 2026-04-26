// Shapes of the TheBrain API responses we consume. Mirrors the
// Swagger-described DTOs from the server side.

export interface AppStateTab {
	id: string;
	brainId: string;
	brainName: string | null;
	isActive: boolean;
	activeThoughtId: string | null;
	activeThoughtName: string | null;
}

export interface AppState {
	currentBrainId: string | null;
	currentBrainName: string | null;
	activeThoughtId: string | null;
	activeThoughtName: string | null;
	isLoggedIn: boolean;
	userId: string | null;
	tabs: AppStateTab[];
}

export interface Brain {
	id: string;
	name: string;
	homeThoughtId: string;
}

export interface Thought {
	id: string;
	brainId: string;
	creationDateTime: string;
	modificationDateTime: string;
	name: string;
	label: string | null;
	typeId: string | null;
	kind: number;
	acType: number;
	foregroundColor: string | null;
	backgroundColor: string | null;
	forgottenDateTime: string | null;
}

export interface ThoughtReference {
	id: string;
	name: string;
}

export interface Attachment {
	id: string;
	brainId: string;
	sourceId: string;
	sourceType: number;
	name: string;
	location: string;
	type: AttachmentType;
	creationDateTime: string;
	modificationDateTime: string;
	isNotes: boolean;
}

export enum AttachmentType {
	Unknown = 0,
	InternalFile = 1,
	ExternalFile = 2,
	ExternalUrl = 3,
	NotesV9 = 4,
	Icon = 5,
	NotesAsset = 6,
	InternalDirectory = 7,
	ExternalDirectory = 8,
}

export enum LinkRelation {
	Child = 1,
	Parent = 2,
	Jump = 3,
	Sibling = 4,
}

export enum ThoughtKind {
	Normal = 1,
	Type = 2,
	Event = 3,
	Tag = 4,
	System = 5,
}

export enum AcType {
	Public = 0,
	Private = 1,
}

export interface CreateThoughtRequest {
	name: string;
	label?: string | null;
	sourceThoughtId: string;
	relation: LinkRelation;
	kind: ThoughtKind;
	typeId?: string | null;
	acType: AcType;
}

export interface CreateThoughtResponse {
	id: string;
}
