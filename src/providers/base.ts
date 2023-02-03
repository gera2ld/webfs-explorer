import type { FSNode, IProviderProps, ISupportedUrl, ProviderScheme } from '../types';
import { parseUrl } from '../util';

export abstract class IFileProvider {
	static scheme: ProviderScheme;

	public data: ISupportedUrl | undefined;

	abstract readOnly: boolean;
	abstract stat(filePath: string): Promise<FSNode>;
	abstract exists(filePath: string): Promise<boolean>;
	abstract readFile(filePath: string): Promise<Uint8Array>;
	abstract readDir(filePath: string): Promise<FSNode[]>;
	abstract setData(data: ISupportedUrl): Promise<void> | void;

	options: IProviderProps[] = [];

	update(options: Record<string, string>): ISupportedUrl | void {
		let { pathname } = options;
		if (/^\/ip[fn]s\//.test(pathname)) pathname = `${pathname.slice(1, 5)}:${pathname.slice(6)}`;
		else if (!/^[\w-]+:/.test(pathname)) pathname = `ipfs:${pathname}`;
		return parseUrl(pathname);
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
