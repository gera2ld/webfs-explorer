import type { IPFS } from 'ipfs-core';
import { loadJs } from './base';

let promise: Promise<IPFS>;

async function createIpfsOnce() {
	await loadJs('https://cdn.jsdelivr.net/npm/ipfs-core@0.18.0/dist/index.min.js');
	const ipfs: IPFS = await window.IpfsCore.create();
	window.ipfs = ipfs;
	ipfs.swarm.connect(
		'/dns4/ipfs.gerald.win/tcp/443/wss/p2p/12D3KooWGVw5nuix8Hz3cppd6FAtBd4omQxoYH46nW8us527VPTa'
	);
	return ipfs;
}

export async function createIpfs() {
	promise ||= createIpfsOnce();
	return promise;
}
