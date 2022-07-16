import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	build: {
		target: 'esnext',
	},

	define: {
		'process.env.NODE_DEBUG': 'false',
		global: 'globalThis',
	},

	plugins: [sveltekit()],

	optimizeDeps: {
		esbuildOptions: {
			target: 'esnext',
		},
	},
};

export default config;
