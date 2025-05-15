import type { ISupportedUrl } from '../types';

export function parseUrl(url: string): ISupportedUrl {
	const data = new URL(url);
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
	if (data.provider === 'npm') {
		return `npm://${data.host}/${data.pathname}`;
	}
	throw new Error('Unsupported URL');
}
