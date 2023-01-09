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
	/** Only available for IPFS */
	cid?: string;
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

export interface IProviderSelectOption {
	type: 'select';
	name: string;
	label?: string;
	value: string;
	data: Array<{ title: string; value: string }>;
}

export interface IProviderInputOption {
	type: 'input';
	name: string;
	label?: string;
	value: string;
	data?: string[];
}

export type IProviderOption = IProviderSelectOption | IProviderInputOption;
