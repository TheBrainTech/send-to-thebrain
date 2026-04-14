import { useCallback, useEffect, useState } from "react";
import { TheBrainLocalClient } from "../api/TheBrainLocalClient";
import { TheBrainError, NoBrainOpenError } from "../api/errors";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/Card";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { Spinner } from "../components/Spinner";
import { tabs, runtime, type ActiveTab } from "../lib/browser";
import { DEFAULT_ENDPOINT, isValidEndpoint } from "../lib/endpoint";
import { sendToBrain, type SendOutcome } from "../lib/sendToBrain";
import { getSettings, updateSettings, type SendMode, type Settings } from "../lib/settings";
import { hasQueryOrHash, stripQueryAndHash } from "../lib/urlTrim";

interface ActiveThought {
	id: string;
	name: string;
	brainName: string | null;
}

const AUTO_CLOSE_MS = 3000;

type ViewState =
	| { kind: "loading" }
	| { kind: "probing" }
	| { kind: "setup" }
	| { kind: "ready" }
	| { kind: "sending" }
	| { kind: "success"; outcome: SendOutcome; client: TheBrainLocalClient }
	| { kind: "error"; message: string; recoverable: boolean };

export function PopupApp() {
	const [settings, setSettings] = useState<Settings | null>(null);
	const [tab, setTab] = useState<ActiveTab | null>(null);
	const [activeThought, setActiveThought] = useState<ActiveThought | null>(null);
	const [view, setView] = useState<ViewState>({ kind: "loading" });

	// Verify that the desktop app is reachable, the API key works, and a brain
	// is open — so the user sees a problem immediately, not only after clicking
	// Send. Called on popup open and again when the user hits Try again.
	const probeConnection = useCallback(async (s: Settings) => {
		setView({ kind: "probing" });
		try {
			const client = new TheBrainLocalClient({ apiKey: s.apiKey, endpoint: s.endpoint });
			const state = await client.getAppState();
			if(!state.currentBrainId || !state.activeThoughtId) {
				throw new NoBrainOpenError();
			}
			setActiveThought({
				id: state.activeThoughtId,
				name: state.activeThoughtName ?? "active thought",
				brainName: state.currentBrainName,
			});
			setView({ kind: "ready" });
		} catch(error) {
			setActiveThought(null);
			const message =
				error instanceof TheBrainError
					? error.message
					: error instanceof Error
						? error.message
						: "Could not reach TheBrain.";
			setView({ kind: "error", message, recoverable: true });
		}
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const s = await getSettings();
			if(cancelled) return;
			setSettings(s);
			if(!s.apiKey) {
				setView({ kind: "setup" });
				return;
			}
			const active = await tabs.getActive();
			if(cancelled) return;
			if(!active) {
				setView({
					kind: "error",
					message: "No active page to save.",
					recoverable: false,
				});
				return;
			}
			setTab(active);
			await probeConnection(s);
		})();
		return () => {
			cancelled = true;
		};
	}, [probeConnection]);

	const handleSend = useCallback(async () => {
		if(!tab || !settings) return;
		setView({ kind: "sending" });
		const client = new TheBrainLocalClient({
			apiKey: settings.apiKey,
			endpoint: settings.endpoint,
		});
		const effectiveUrl = settings.trimQueryParams
			? stripQueryAndHash(tab.url)
			: tab.url;
		try {
			const outcome = await sendToBrain({
				client,
				tabTitle: tab.title,
				tabUrl: effectiveUrl,
				mode: settings.mode,
				activateAfterSend: settings.activateAfterSend,
			});
			setView({ kind: "success", outcome, client });
		} catch(error) {
			const message =
				error instanceof TheBrainError
					? error.message
					: error instanceof Error
						? error.message
						: "Something went wrong.";
			setView({ kind: "error", message, recoverable: true });
		}
	}, [tab, settings]);

	const handleTrimChange = useCallback(
		async (trimQueryParams: boolean) => {
			await updateSettings({ trimQueryParams });
			setSettings((prev) => (prev ? { ...prev, trimQueryParams } : prev));
		},
		[],
	);

	const handleModeChange = useCallback(async (mode: SendMode) => {
		await updateSettings({ mode });
		setSettings((prev) => (prev ? { ...prev, mode } : prev));
	}, []);

	// Auto-dismiss the popup after a successful save so it feels like a
	// one-click action. If the user wants to interact ("Open in TheBrain"),
	// they have a brief window before the popup closes.
	useEffect(() => {
		if(view.kind !== "success") return;
		const id = window.setTimeout(() => window.close(), AUTO_CLOSE_MS);
		return () => window.clearTimeout(id);
	}, [view.kind]);

	const handleSetupComplete = useCallback(async (apiKey: string, endpoint: string) => {
		await updateSettings({ apiKey, endpoint });
		const next = await getSettings();
		setSettings(next);
		const active = await tabs.getActive();
		if(!active) {
			setView({
				kind: "error",
				message: "No active page to save.",
				recoverable: false,
			});
			return;
		}
		setTab(active);
		await probeConnection(next);
	}, [probeConnection]);

	const handleRetry = useCallback(async () => {
		if(!settings) return;
		await probeConnection(settings);
	}, [settings, probeConnection]);

	if(view.kind === "loading" || view.kind === "probing") {
		return (
			<div className="flex flex-col items-center justify-center gap-2 p-8 text-xs text-muted-foreground">
				<Spinner />
				{view.kind === "probing" && <span>Checking connection…</span>}
			</div>
		);
	}

	if(view.kind === "setup") {
		return <SetupView onComplete={handleSetupComplete} />;
	}

	return (
		<div className="flex flex-col gap-3 p-4">
			<Header />
			{view.kind === "ready" && settings && tab && activeThought && (
				<ReadyCard
					tab={tab}
					activeThought={activeThought}
					mode={settings.mode}
					onModeChange={handleModeChange}
					trimQueryParams={settings.trimQueryParams}
					onTrimChange={handleTrimChange}
					onSend={handleSend}
				/>
			)}
			{view.kind === "sending" && tab && <SendingCard tab={tab} />}
			{view.kind === "success" && (
				<SuccessCard
					outcome={view.outcome}
					onOpen={() =>
						view.client.activateThought(view.outcome.brainId, view.outcome.thoughtId)
					}
					onReset={() => setView({ kind: "ready" })}
				/>
			)}
			{view.kind === "error" && (
				<ErrorCard
					message={view.message}
					onRetry={view.recoverable ? handleRetry : undefined}
					onOpenSettings={() => runtime.openOptionsPage()}
				/>
			)}
		</div>
	);
}

function Header() {
	return (
		<div className="flex items-center gap-2">
			<Logo className="h-6 w-6 text-brand" />
			<span className="text-sm font-semibold">Send to TheBrain</span>
			<button
				type="button"
				className="ml-auto text-xs text-muted-foreground hover:text-foreground"
				onClick={() => runtime.openOptionsPage()}
			>
				Settings
			</button>
		</div>
	);
}

function ReadyCard({
	tab,
	activeThought,
	mode,
	onModeChange,
	trimQueryParams,
	onTrimChange,
	onSend,
}: {
	tab: ActiveTab;
	activeThought: ActiveThought;
	mode: SendMode;
	onModeChange: (mode: SendMode) => void;
	trimQueryParams: boolean;
	onTrimChange: (value: boolean) => void;
	onSend: () => void;
}) {
	const showTrimOption = hasQueryOrHash(tab.url);
	const previewUrl = showTrimOption && trimQueryParams ? stripQueryAndHash(tab.url) : tab.url;
	const sendLabel =
		mode === "createChild"
			? `Create child of "${activeThought.name}"`
			: `Attach to "${activeThought.name}"`;
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{tab.title || tab.url}</CardTitle>
				<p className="truncate text-xs text-muted-foreground">{previewUrl}</p>
			</CardHeader>
			<CardContent className="flex flex-col gap-3 pt-0">
				<div className="text-xs text-muted-foreground">
					Active thought:{" "}
					<span className="font-medium text-foreground">{activeThought.name}</span>
					{activeThought.brainName && (
						<span className="text-muted-foreground"> · {activeThought.brainName}</span>
					)}
				</div>
				<ModeToggle mode={mode} onChange={onModeChange} />
				{showTrimOption && (
					<label className="flex items-center gap-2 text-xs text-muted-foreground">
						<input
							type="checkbox"
							className="h-3.5 w-3.5 accent-brand"
							checked={trimQueryParams}
							onChange={(e) => onTrimChange(e.target.checked)}
						/>
						<span>Remove query parameters &amp; fragment</span>
					</label>
				)}
			</CardContent>
			<CardFooter>
				<Button onClick={onSend} className="w-full truncate">
					{sendLabel}
				</Button>
			</CardFooter>
		</Card>
	);
}

function ModeToggle({ mode, onChange }: { mode: SendMode; onChange: (mode: SendMode) => void }) {
	const options: { value: SendMode; label: string }[] = [
		{ value: "createChild", label: "Create child" },
		{ value: "attachToActive", label: "Attach" },
	];
	return (
		<div
			className="inline-flex w-full items-center gap-1 rounded-full border border-border bg-background p-1"
			role="radiogroup"
			aria-label="Send mode"
		>
			{options.map((opt) => {
				const active = mode === opt.value;
				return (
					<button
						key={opt.value}
						type="button"
						role="radio"
						aria-checked={active}
						onClick={() => onChange(opt.value)}
						className={
							"flex-1 rounded-full px-3 py-1 text-xs font-medium transition-colors " +
							(active
								? "bg-brand text-brand-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground")
						}
					>
						{opt.label}
					</button>
				);
			})}
		</div>
	);
}

function SendingCard({ tab }: { tab: ActiveTab }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{tab.title || tab.url}</CardTitle>
			</CardHeader>
			<CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
				<Spinner />
				Sending...
			</CardContent>
		</Card>
	);
}

function SuccessCard({
	outcome,
	onOpen,
	onReset: _onReset,
}: {
	outcome: SendOutcome;
	onOpen: () => void;
	onReset: () => void;
}) {
	const title =
		outcome.kind === "created"
			? "Added to your brain"
			: outcome.kind === "attached"
				? "Attached to the active thought"
				: "Already in your brain";
	const message =
		outcome.kind === "created"
			? `Created "${outcome.thoughtName}"${"label" in outcome && outcome.label ? ` (${outcome.label})` : ""}.`
			: outcome.kind === "attached"
				? `Attached to "${outcome.thoughtName}".`
				: `Found existing thought "${outcome.thoughtName}".`;
	// Two-pass render so the bar animates: start at 100%, then on the next
	// paint flip to 0% and let the CSS transition run over AUTO_CLOSE_MS.
	const [barWidth, setBarWidth] = useState("100%");
	useEffect(() => {
		const id = requestAnimationFrame(() => setBarWidth("0%"));
		return () => cancelAnimationFrame(id);
	}, []);
	return (
		<>
			<Alert variant="success" title={title}>
				{message}
			</Alert>
			<Button variant="secondary" onClick={onOpen}>
				Open in TheBrain
			</Button>
			<div
				className="h-1 w-full overflow-hidden rounded-full bg-muted"
				aria-hidden
				title="Closing shortly"
			>
				<div
					className="h-full bg-success ease-linear"
					style={{
						width: barWidth,
						transitionProperty: "width",
						transitionDuration: `${AUTO_CLOSE_MS}ms`,
					}}
				/>
			</div>
		</>
	);
}

function ErrorCard({
	message,
	onRetry,
	onOpenSettings,
}: {
	message: string;
	onRetry?: () => void;
	onOpenSettings: () => void;
}) {
	return (
		<>
			<Alert variant="error" title="Couldn't save">
				{message}
			</Alert>
			<div className="flex gap-2">
				{onRetry && (
					<Button variant="secondary" onClick={onRetry} className="flex-1">
						Try again
					</Button>
				)}
				<Button variant="ghost" onClick={onOpenSettings} className="flex-1">
					Open settings
				</Button>
			</div>
		</>
	);
}

interface SetupViewProps {
	onComplete: (apiKey: string, endpoint: string) => void;
}

function SetupView({ onComplete }: SetupViewProps) {
	const [apiKey, setApiKey] = useState("");
	const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
	const [testing, setTesting] = useState(false);
	const [result, setResult] = useState<
		| { kind: "idle" }
		| { kind: "success"; brains: number }
		| { kind: "error"; message: string }
	>({ kind: "idle" });

	const keyValid = apiKey.trim().length > 0;
	const endpointValid = isValidEndpoint(endpoint);
	const canSubmit = keyValid && endpointValid;

	const handleTest = async () => {
		setTesting(true);
		setResult({ kind: "idle" });
		try {
			const client = new TheBrainLocalClient({
				apiKey: apiKey.trim(),
				endpoint: endpoint.trim(),
			});
			const brains = await client.getBrains();
			setResult({ kind: "success", brains: brains.length });
		} catch(error) {
			const message =
				error instanceof TheBrainError
					? error.message
					: error instanceof Error
						? error.message
						: "Could not connect.";
			setResult({ kind: "error", message });
		} finally {
			setTesting(false);
		}
	};

	return (
		<div className="flex flex-col gap-3 p-4">
			<div className="flex items-center gap-2">
				<Logo className="h-7 w-7 text-brand" />
				<span className="text-base font-semibold">Connect to TheBrain</span>
			</div>
			<Card>
				<CardContent className="flex flex-col gap-3 pt-4 text-sm">
					<div>
						<p className="mb-1 font-medium">To connect:</p>
						<ol className="list-decimal pl-5 text-muted-foreground">
							<li>Open the TheBrain desktop app.</li>
							<li>Go to Settings &rarr; User &rarr; Local API.</li>
							<li>Copy the API Endpoint and API Key, and paste them below.</li>
						</ol>
					</div>
					<label className="flex flex-col gap-1.5">
						<span className="text-xs font-medium">API endpoint</span>
						<Input
							type="text"
							autoComplete="off"
							placeholder="http://localhost:5000/api/"
							value={endpoint}
							onChange={(e) => setEndpoint(e.target.value)}
						/>
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="text-xs font-medium">API key</span>
						<Input
							type="password"
							autoComplete="off"
							placeholder="Paste your key"
							value={apiKey}
							onChange={(e) => setApiKey(e.target.value)}
						/>
					</label>
					{result.kind === "success" && (
						<Alert variant="success" title="Connected">
							Found {result.brains} {result.brains === 1 ? "brain" : "brains"}.
						</Alert>
					)}
					{result.kind === "error" && (
						<Alert variant="error" title="Couldn't connect">
							{result.message}
						</Alert>
					)}
				</CardContent>
				<CardFooter className="flex-col gap-2">
					<Button
						variant="secondary"
						onClick={handleTest}
						disabled={!canSubmit || testing}
						className="w-full"
					>
						{testing ? <Spinner /> : "Test connection"}
					</Button>
					<Button
						onClick={() => onComplete(apiKey.trim(), endpoint.trim())}
						disabled={!canSubmit}
						className="w-full"
					>
						Save and continue
					</Button>
				</CardFooter>
			</Card>
			<p className="text-xs text-muted-foreground">
				You can change these anytime in the options page.
			</p>
		</div>
	);
}
