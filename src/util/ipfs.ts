import type { IPFS } from 'ipfs-core';
import { loadJs } from './base';

let promise: Promise<IPFS>;

async function createIpfsOnce() {
	await loadJs(
		'https://cdn.jsdelivr.net/combine/npm/ipfs-core@0.18.0/dist/index.min.js,npm/@multiformats/multiaddr@11.4.0/dist/index.min.js'
	);
	const { create } = (await import('ipfs-core')).default;
	const { multiaddr } = (await import('@multiformats/multiaddr')).default;
	const ipfs: IPFS = await create();
	ipfs.swarm.connect(
		multiaddr(
			'/dns4/swarm.ipfs.gerald.win/tcp/443/wss/p2p/12D3KooWDefwokBAv16Z9CpB5fCxkxa481xB5VHYSesmh4kkFchi'
		)
	);
	return ipfs;
}

export async function createIpfs() {
	promise ||= createIpfsOnce();
	return promise;
}
