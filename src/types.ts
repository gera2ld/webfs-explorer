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
