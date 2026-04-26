import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chromeDist = path.join(root, "dist");
const firefoxDist = path.join(root, "dist-firefox");
const chromeManifestPath = path.join(chromeDist, "manifest.json");
const firefoxManifestPath = path.join(firefoxDist, "manifest.json");

if(!fs.existsSync(chromeManifestPath)) {
	throw new Error("Run the Vite build before creating the Firefox package.");
}

fs.rmSync(firefoxDist, { recursive: true, force: true });
fs.cpSync(chromeDist, firefoxDist, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(chromeManifestPath, "utf8"));
const serviceWorker = manifest.background?.service_worker;

if(!serviceWorker) {
	throw new Error("Expected the Chrome build to emit background.service_worker.");
}

manifest.background = {
	scripts: [serviceWorker],
	type: manifest.background?.type ?? "module",
};

manifest.browser_specific_settings = {
	gecko: {
		id: "send-to-thebrain@thebrain.com",
		strict_min_version: "109.0",
	},
};

fs.writeFileSync(firefoxManifestPath, `${JSON.stringify(manifest, null, "\t")}\n`);

console.log(`Firefox extension written to ${path.relative(root, firefoxDist)}`);
