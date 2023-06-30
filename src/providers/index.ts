import { IPFSProvider } from './ipfs';
import { NPMProvider } from './npm';

export type { IFileProvider } from './base';

export { IPFSProvider, NPMProvider };

export const providerFactories = [IPFSProvider, NPMProvider];
