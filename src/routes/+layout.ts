import { browser } from '$app/environment';
import { createIpfs } from '../util/ipfs';

export const prerender = true;

if (browser) {
	window.ipfsPromise = createIpfs();
}
