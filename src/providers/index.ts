import type { ISupportedUrl } from '../types';
import type { IFileProvider } from './base';
import { create as createIpfsProvider } from './ipfs';
import { create as createMfsProvider } from './mfs';
import { create as createNpmProvider } from './npm';

const providerFactories: Record<string, (url: ISupportedUrl) => Promise<IFileProvider>> = {
	ipfs: createIpfsProvider,
	'ipfs-mfs': createMfsProvider,
	npm: createNpmProvider,
};

export async function createProvider(url: ISupportedUrl) {
	const create = providerFactories[url.provider];
	if (!create) throw new Error(`Unsupported provider: ${url.provider}`);
	const provider = await create(url);
	return provider;
}
