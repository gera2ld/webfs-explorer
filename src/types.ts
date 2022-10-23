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

export interface IFileProvider {
	readOnly: boolean;
	stat(filePath: string): Promise<FSNode>;
	exists(filePath: string): Promise<boolean>;
	readFile(filePath: string): Promise<Uint8Array>;
	readDir(filePath: string): Promise<FSNode[]>;
	writeFile(filePath: string, content: string): Promise<void>;
	rename(sourcePath: string, filePath: string): Promise<void>;
	delete(filePath: string): Promise<void>;
	mkdir(filePath: string): Promise<void>;
}
