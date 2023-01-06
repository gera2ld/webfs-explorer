export interface ISupportedUrl {
	provider: 'ipfs' | 'ipfs-mfs' | 'npm';
	pathname: string;
	query?: Record<string, string>;
}

export interface FSNode {
	type: 'file' | 'directory';
	path: string;
	name: string;
	size: number;
	expand?: boolean;
	children?: FSNode[];
	parent?: FSNode;
	dirty?: boolean;
}

export interface IPFSNode extends FSNode {
	cid: string;
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
	abstract readOnly: boolean;
	abstract stat(filePath: string): Promise<FSNode>;
	abstract exists(filePath: string): Promise<boolean>;
	abstract readFile(filePath: string): Promise<Uint8Array>;
	abstract readDir(filePath: string): Promise<FSNode[]>;

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
