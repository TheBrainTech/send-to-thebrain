// Rasterizes public/toolbar-icon.svg to the four PNG sizes the Chrome
// extension manifest declares for the browser toolbar / extensions page.
// Uses sharp, the standard Node image library.
//
// Note: the toolbar source is intentionally distinct from public/logo.svg
// (the line-art mark used inline in the popup / options header). The
// toolbar version is a higher-contrast solid badge that stays legible at
// 16×16, while the popup uses the lighter outline mark.

import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "toolbar-icon.svg");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

// Source SVG viewBox is 178×178; oversample so small sizes stay sharp.
const SOURCE_VIEWBOX = 178;
const SIZES = [16, 32, 48, 128];
const svg = readFileSync(svgPath);

for(const size of SIZES) {
	const file = join(outDir, `icon-${size}.png`);
	await sharp(svg, { density: Math.ceil((size / SOURCE_VIEWBOX) * 96 * 4) })
		.resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.png()
		.toFile(file);
	console.log(`wrote ${file}`);
}
