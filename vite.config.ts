// -------------------------------------------------------------------------------------------

import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

import react from '@vitejs/plugin-react';

// -------------------------------------------------------------------------------------------

export default defineConfig({
	plugins: [
		react(),
		viteCompression({
			verbose: true,
			disable: false,
			threshold: 8,
			algorithm: 'gzip',
			ext: '.gz',
			compressionOptions: { level: 9 },
			deleteOriginFile: false,
		}),
	],
	server: {
		proxy: {
			'/recaptcha': {
				target: 'https://www.google.com',
				changeOrigin: true,
			},
		},
	},
	build: {
		target: 'esnext',
		minify: 'terser',
		terserOptions: {
			ecma: 2020,
			compress: {
				arrows: true,
				booleans: true,
				collapse_vars: true,
				comparisons: true,
				computed_props: true,
				dead_code: true,
				drop_console: true,
				drop_debugger: true,
				evaluate: true,
				hoist_funs: true,
				hoist_props: true,
				hoist_vars: true,
				if_return: true,
				inline: true,
				loops: true,
				negate_iife: true,
				properties: true,
				reduce_funcs: true,
				reduce_vars: true,
				sequences: true,
				switches: true,
				toplevel: true,
				typeofs: true,
				unused: true,
				conditionals: true,
				join_vars: true,
			},
			mangle: {
				toplevel: true,
			},
			format: {
				comments: false,
			},
			module: true,
			toplevel: true,
		},
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				},
			},
		},
		chunkSizeWarningLimit: 10240,
	},
	optimizeDeps: {
		include: ['react', 'react-dom'],
	},
	esbuild: {
		treeShaking: true,
	},
});

// -------------------------------------------------------------------------------------------
