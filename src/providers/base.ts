import type { FSNode, IProviderOption, ISupportedUrl } from '../types';

export abstract class IFileProvider {
	constructor(public data: ISupportedUrl) {}

	abstract readOnly: boolean;
	abstract stat(filePath: string): Promise<FSNode>;
	abstract exists(filePath: string): Promise<boolean>;
	abstract readFile(filePath: string): Promise<Uint8Array>;
	abstract readDir(filePath: string): Promise<FSNode[]>;

	options: IProviderOption[] = [];

	setOptions(options: Record<string, string>): ISupportedUrl | void {
		// noop
	}

	async writeFile(ipfsPath: string, content: string) {
		throw new Error('Not allowed');
	}

	async rename(sourcePath: string, filePath: string) {
		throw new Error('Not allowed');
	}

	async delete(ipfsPath: string) {
		throw new Error('Not allowed');
	}

	async mkdir(ipfsPath: string) {
		throw new Error('Not allowed');
	}
}
