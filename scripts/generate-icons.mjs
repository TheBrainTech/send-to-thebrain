// Rasterizes public/logo.svg to the four PNG sizes the Chrome extension
// manifest declares. Uses sharp, the standard Node image library.

import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "logo.svg");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const SIZES = [16, 32, 48, 128];
const svg = readFileSync(svgPath);

for(const size of SIZES) {
	const file = join(outDir, `icon-${size}.png`);
	await sharp(svg, { density: Math.ceil((size / 160) * 96 * 4) })
		.resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.png()
		.toFile(file);
	console.log(`wrote ${file}`);
}
