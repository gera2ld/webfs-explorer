import type { ISupportedUrl } from '../types';

export function parseUrl(url: string): ISupportedUrl {
	const data = new URL(url);
	const pathname = data.pathname.replace(/^\/\//, '');
	if (['ipfs:', 'ipns:'].includes(data.protocol)) {
		// ipfs:///path/to/file
		// ipfs:/path/to/file
		if (pathname.startsWith('/')) {
			return {
				provider: 'ipfs-mfs',
				pathname,
			};
		}
		// ipfs://CID
		// ipfs:CID
		return {
			provider: 'ipfs',
			pathname: `/${data.protocol.slice(0, -1)}/${pathname}`,
		};
	}
	if (data.protocol === 'npm:') {
		// npm:@gera2ld/tarjs
		// npm:@gera2ld/tarjs@latest?registry=registry.npmmirror.com
		const query = [...data.searchParams.entries()].reduce((prev, [key, value]) => {
			prev[key] = value;
			return prev;
		}, {} as Record<string, string>);
		return {
			provider: 'npm',
			pathname,
			query,
		};
	}
	throw new Error('Unsupported URL');
}

export function reprUrl(data: ISupportedUrl) {
	if (data.provider === 'ipfs-mfs') return `ipfs:${data.pathname}`;
	if (data.provider === 'ipfs') {
		const [, protocol, ...rest] = data.pathname.split('/');
		return `${protocol}:${rest.join('/')}`;
	}
	if (data.provider === 'npm') {
		const qs = new URLSearchParams(data.query).toString();
		return `npm:${data.pathname}${qs ? '?' : ''}${qs}`;
	}
	throw new Error('Unsupported URL');
}
