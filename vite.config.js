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

	plugins: [
		externals({
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

/** @param {Record<string, string>} itemMap */
function externals(externalMap) {
	return {
		name: 'external',
		enforce: 'pre',
		resolveId(id) {
			if (externalMap[id]) return '\0' + id;
		},
		load(id) {
			if (id[0] !== '\0') return null;
			const path = externalMap[id.slice(1)];
			return path ? `export default ${path}` : null;
		},
	};
}
