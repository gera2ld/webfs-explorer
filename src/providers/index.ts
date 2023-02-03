import { IPFSProvider } from './ipfs';
import { MFSProvider } from './mfs';
import { NPMProvider } from './npm';

export type { IFileProvider } from './base';

export { IPFSProvider, MFSProvider, NPMProvider };

export const providerFactories = [IPFSProvider, MFSProvider, NPMProvider];
