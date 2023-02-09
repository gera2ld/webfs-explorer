import { sveltekit } from '@sveltejs/kit/vite';
import { viteExternalsPlugin } from 'vite-plugin-externals';

/** @type {import('vite').UserConfig} */
const config = {
	build: {
		target: 'esnext',
	},

	define: {
		'process.env.NODE_DEBUG': 'false',
		global: 'globalThis',
	},

	plugins: [
		viteExternalsPlugin({
			'ipfs-core': 'IpfsCore',
			'ipfs-http-client': 'IpfsHttpClient',
			'@multiformats/multiaddr': 'MultiformatsMultiaddr',
		}),
		sveltekit(),
	],

	optimizeDeps: {
		esbuildOptions: {
			target: 'esnext',
		},
	},
};

export default config;
