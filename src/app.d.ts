/// <reference types="@sveltejs/kit" />
import * as IPFSCore from 'ipfs-core';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Locals {}
	// interface Platform {}
	// interface Session {}
	// interface Stuff {}
}

declare global {
	interface Window {
		IpfsCore: IPFSCore;
		ipfsPromise: Promise<IPFSCore.IPFS>;
		monaco: any;
		monacoPromise: Promise<any>;
	}
}
