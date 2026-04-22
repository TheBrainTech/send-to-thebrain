import { useEffect, useState } from "react";
import { TheBrainLocalClient } from "../api/TheBrainLocalClient";
import { TheBrainError } from "../api/errors";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/Card";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { Spinner } from "../components/Spinner";
import { isValidEndpoint } from "../lib/endpoint";
import {
	getSettings,
	parseExceptionList,
	updateSettings,
	type SendMode,
	type Settings,
} from "../lib/settings";

type TestResult =
	| { kind: "idle" }
	| { kind: "testing" }
	| { kind: "success"; brains: number }
	| { kind: "error"; message: string };

export function OptionsApp() {
	const [settings, setSettings] = useState<Settings | null>(null);
	const [apiKey, setApiKey] = useState("");
	const [endpoint, setEndpoint] = useState("");
	const [showKey, setShowKey] = useState(false);
	const [test, setTest] = useState<TestResult>({ kind: "idle" });
	const [saved, setSaved] = useState(false);
	const [exceptionsText, setExceptionsText] = useState("");

	useEffect(() => {
		getSettings().then((s) => {
			setSettings(s);
			setApiKey(s.apiKey);
			setEndpoint(s.endpoint);
			setExceptionsText(s.trimQueryParamsExceptions.join("\n"));
		});
	}, []);

	if(!settings) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const persist = async (patch: Partial<Settings>) => {
		await updateSettings(patch);
		setSettings({ ...settings, ...patch });
		setSaved(true);
		setTimeout(() => setSaved(false), 1500);
	};

	const canSave =
		apiKey.trim().length > 0 &&
		isValidEndpoint(endpoint) &&
		(apiKey.trim() !== settings.apiKey || endpoint.trim() !== settings.endpoint);

	const handleSave = async () => {
		await persist({ apiKey: apiKey.trim(), endpoint: endpoint.trim() });
	};

	const handleTest = async () => {
		setTest({ kind: "testing" });
		try {
			const client = new TheBrainLocalClient({
				apiKey: apiKey.trim(),
				endpoint: endpoint.trim(),
			});
			const brains = await client.getBrains();
			setTest({ kind: "success", brains: brains.length });
		} catch(error) {
			const message =
				error instanceof TheBrainError
					? error.message
					: error instanceof Error
						? error.message
						: "Could not connect.";
			setTest({ kind: "error", message });
		}
	};

	const handleModeChange = (mode: SendMode) => {
		persist({ mode });
	};

	const handleActivateChange = (activateAfterSend: boolean) => {
		persist({ activateAfterSend });
	};

	const handleExceptionsBlur = async () => {
		const parsed = parseExceptionList(exceptionsText);
		const current = settings.trimQueryParamsExceptions;
		const same =
			parsed.length === current.length &&
			parsed.every((v, i) => v === current[i]);
		// Re-format the textarea even if unchanged, so the user sees the
		// normalized list (lowercased, deduped, hostnames only).
		setExceptionsText(parsed.join("\n"));
		if(!same) {
			await persist({ trimQueryParamsExceptions: parsed });
		}
	};

	return (
		<div className="mx-auto flex max-w-xl flex-col gap-6 p-6">
			<header className="flex items-center gap-3">
				<Logo className="h-8 w-8 text-brand" />
				<div>
					<h1 className="text-xl font-semibold">Send to TheBrain</h1>
					<p className="text-sm text-muted-foreground">Options</p>
				</div>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>Connection</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<p className="text-sm text-muted-foreground">
						Copy both values from the TheBrain desktop app &rarr; Settings &rarr;
						User &rarr; Local API.
					</p>
					<label className="flex flex-col gap-1.5">
						<span className="text-xs font-medium">API endpoint</span>
						<Input
							type="text"
							value={endpoint}
							onChange={(e) => setEndpoint(e.target.value)}
							placeholder="http://localhost:8001/api/"
							autoComplete="off"
						/>
					</label>
					<label className="flex flex-col gap-1.5">
						<span className="text-xs font-medium">API key</span>
						<div className="flex gap-2">
							<Input
								type={showKey ? "text" : "password"}
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder="Paste your key"
								autoComplete="off"
							/>
							<Button variant="ghost" onClick={() => setShowKey((v) => !v)}>
								{showKey ? "Hide" : "Show"}
							</Button>
						</div>
					</label>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							onClick={handleTest}
							disabled={!apiKey.trim() || !isValidEndpoint(endpoint) || test.kind === "testing"}
						>
							{test.kind === "testing" ? <Spinner /> : "Test connection"}
						</Button>
						<Button onClick={handleSave} disabled={!canSave}>
							Save
						</Button>
					</div>
					{test.kind === "success" && (
						<Alert variant="success" title="Connected">
							Found {test.brains} {test.brains === 1 ? "brain" : "brains"}.
						</Alert>
					)}
					{test.kind === "error" && (
						<Alert variant="error" title="Couldn't connect">
							{test.message}
						</Alert>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>When I click the extension</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<ModeRadio
						value={settings.mode}
						onChange={handleModeChange}
						option="createChild"
						title="Create a child thought"
						description="Adds a new child under the active thought and attaches the URL to it."
					/>
					<ModeRadio
						value={settings.mode}
						onChange={handleModeChange}
						option="attachToActive"
						title="Attach to the active thought"
						description="Adds the page URL as an attachment on the currently active thought."
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>After sending</CardTitle>
				</CardHeader>
				<CardContent>
					<label className="flex items-center gap-3 text-sm">
						<input
							type="checkbox"
							checked={settings.activateAfterSend}
							onChange={(e) => handleActivateChange(e.target.checked)}
							className="h-4 w-4 accent-brand"
						/>
						<span>
							Activate the thought in TheBrain
							<span className="block text-xs text-muted-foreground">
								Navigates TheBrain to the thought after it's saved.
							</span>
						</span>
					</label>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Trim query parameters</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<p className="text-sm text-muted-foreground">
						The popup offers a checkbox to drop the query string and fragment
						from the saved URL. List domains here where that checkbox should
						be hidden — useful for sites like YouTube where the query string
						(<code>?v=…</code>) identifies the page. Subdomains are matched
						automatically; one entry per line.
					</p>
					<label className="flex flex-col gap-1.5">
						<span className="text-xs font-medium">Domains to never trim</span>
						<textarea
							className="min-h-[6rem] w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand"
							value={exceptionsText}
							onChange={(e) => setExceptionsText(e.target.value)}
							onBlur={handleExceptionsBlur}
							spellCheck={false}
							placeholder={"youtube.com\nyoutu.be"}
						/>
					</label>
				</CardContent>
			</Card>

			{saved && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-success px-4 py-2 text-sm text-success-foreground shadow-md">
					Saved
				</div>
			)}
		</div>
	);
}

interface ModeRadioProps {
	value: SendMode;
	onChange: (mode: SendMode) => void;
	option: SendMode;
	title: string;
	description: string;
}

function ModeRadio({ value, onChange, option, title, description }: ModeRadioProps) {
	const checked = value === option;
	return (
		<label
			className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition-colors ${
				checked ? "border-brand bg-brand/5" : "border-border hover:bg-secondary"
			}`}
		>
			<input
				type="radio"
				name="mode"
				className="mt-0.5 h-4 w-4 accent-brand"
				checked={checked}
				onChange={() => onChange(option)}
			/>
			<span>
				<span className="block font-medium">{title}</span>
				<span className="block text-xs text-muted-foreground">{description}</span>
			</span>
		</label>
	);
}
