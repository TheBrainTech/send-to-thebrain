// Typed errors surfaced by TheBrainLocalClient. UI maps each one to a
// friendly message; keeping them as classes keeps the branching in
// PopupApp explicit.

export class TheBrainError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TheBrainError";
	}
}

export class NotRunningError extends TheBrainError {
	constructor() {
		super("TheBrain isn't running. Start the desktop app and try again.");
		this.name = "NotRunningError";
	}
}

export class InvalidKeyError extends TheBrainError {
	constructor() {
		super("Your API key is invalid. Open settings to paste a new one.");
		this.name = "InvalidKeyError";
	}
}

export class UserMismatchError extends TheBrainError {
	constructor() {
		super("This API key is for a different user than the one signed in to TheBrain.");
		this.name = "UserMismatchError";
	}
}

export class NoBrainOpenError extends TheBrainError {
	constructor() {
		super("Open a brain in TheBrain first, then try again.");
		this.name = "NoBrainOpenError";
	}
}

export class ReadOnlyBrainError extends TheBrainError {
	constructor() {
		super("This brain is read-only. Open a brain you can write to.");
		this.name = "ReadOnlyBrainError";
	}
}

export class ApiError extends TheBrainError {
	readonly status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = "ApiError";
	}
}
