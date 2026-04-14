import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import path from "node:path";
import manifest from "./manifest.json";

export default defineConfig({
	plugins: [react(), crx({ manifest })],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	build: {
		target: "esnext",
		rollupOptions: {
			input: {
				popup: path.resolve(__dirname, "src/popup/index.html"),
				options: path.resolve(__dirname, "src/options/index.html"),
			},
		},
	},
	test: {
		globals: true,
		environment: "node",
	},
});
