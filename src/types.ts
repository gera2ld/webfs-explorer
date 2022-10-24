export interface FSNode {
	type: 'file' | 'directory';
	path: string;
	cid: string;
	name: string;
	size: number;
	expand?: boolean;
	children?: FSNode[];
	parent?: FSNode;
	dirty?: boolean;
}

export type FileData =
	| {
			type: 'unknown' | 'image';
			content: Uint8Array;
	  }
	| {
			type: 'text';
			language?: string;
			content: string;
	  }
	| {
			type: 'directory';
			content: null;
	  };

export abstract class IFileProvider {
	static create(): Promise<IFileProvider> {
		throw new Error('Not implemented');
	}
	abstract readOnly: boolean;
	abstract stat(filePath: string): Promise<FSNode>;
	abstract exists(filePath: string): Promise<boolean>;
	abstract readFile(filePath: string): Promise<Uint8Array>;
	abstract readDir(filePath: string): Promise<FSNode[]>;
	abstract writeFile(filePath: string, content: string): Promise<void>;
	abstract rename(sourcePath: string, filePath: string): Promise<void>;
	abstract delete(filePath: string): Promise<void>;
	abstract mkdir(filePath: string): Promise<void>;
}
