import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Lightweight config — no SvelteKit plugin needed. The files under test import types
// only via `import type` (erased by esbuild), so the sole runtime alias we need is
// `$lib` for the JSON data files (price-benchmarks.json, scope-checker-rules.json).
export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
		},
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
	},
});
