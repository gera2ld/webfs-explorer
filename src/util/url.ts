import { URL } from 'whatwg-url';
import type { ISupportedUrl } from '../types';

export function parseUrl(url: string): ISupportedUrl {
	const data = new URL(url);
	if (['ipfs:', 'ipns:'].includes(data.protocol)) {
		// ipfs://CID[/path/to/file]
		// ipns://www.example.com[/path/to/file]
		if (!data.host) throw new Error('Invalid IPFS URL');
		const pathname = [data.protocol.slice(0, -1), data.host, ...data.pathname.split('/')]
			.filter(Boolean)
			.join('/');
		return {
			provider: 'ipfs',
			pathname,
		};
	}
	if (data.protocol === 'npm:') {
		// npm:[//registry.npmmirror.com][/][@gera2ld/]tarjs[@latest][/path/to/file]
		const pathname = data.pathname.replace(/^\/?/, '');
		return {
			provider: 'npm',
			host: data.host || '',
			pathname,
		};
	}
	throw new Error('Unsupported URL');
}

export function reprUrl(data: ISupportedUrl) {
	if (data.provider === 'ipfs') {
		const [protocol, host, ...rest] = data.pathname.split('/');
		return `${protocol}://${host}/${rest.join('/')}`;
	}
	if (data.provider === 'npm') {
		return `npm://${data.host}/${data.pathname}`;
	}
	throw new Error('Unsupported URL');
}
