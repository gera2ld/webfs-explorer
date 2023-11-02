import type { ProviderScheme } from '../types';
import { IPFSProvider } from './ipfs';
import { NPMProvider } from './npm';
import type { IFileProvider } from './base';

export { IPFSProvider, NPMProvider, IFileProvider };

export const providerFactories = [IPFSProvider, NPMProvider];

const providers: Partial<Record<ProviderScheme, IFileProvider>> = {};

export function getProvider(scheme: ProviderScheme) {
	let provider = providers[scheme];
	if (!provider) {
		const Factory = providerFactories.find((factory) => factory.scheme === scheme);
		if (!Factory) throw new Error(`Unknown scheme: ${scheme}`);
		provider = new Factory();
		providers[scheme] = provider;
	}
	return provider;
}
