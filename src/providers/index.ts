import type { ProviderScheme } from '../types';
import type { IFileProvider } from './base';
import { NPMProvider } from './npm';

export { NPMProvider, type IFileProvider };

export const providerFactories = [NPMProvider];

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
