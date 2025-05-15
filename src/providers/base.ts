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
		const { pathname } = options;
		return parseUrl(pathname);
	}

	async writeFile(_path: string, _content: string) {
		throw new Error('Not allowed');
	}

	async rename(_sourcePath: string, _targetPath: string) {
		throw new Error('Not allowed');
	}

	async delete(_path: string) {
		throw new Error('Not allowed');
	}

	async mkdir(_path: string) {
		throw new Error('Not allowed');
	}
}
