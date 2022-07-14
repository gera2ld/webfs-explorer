export interface FSNode {
	type: 'file' | 'directory';
	path: string;
	cid: string;
	name: string;
	size: number;
	children?: FSNode[];
	content?: Uint8Array;
	expand?: boolean;
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
