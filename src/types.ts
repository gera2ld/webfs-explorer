export type ProviderScheme = 'npm';

export interface ISupportedUrl {
	provider: ProviderScheme;
	host?: string;
	pathname: string;
}

export interface FSNode {
	type: 'file' | 'directory';
	path: string;
	name: string;
	size: bigint;
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

export interface IProviderSelectData {
	value: string;
	options: Array<{ title: string; value: string }>;
}

export interface IProviderSelectProps {
	type: 'select';
	name: string;
	label?: string;
	data: () => Promise<IProviderSelectData>;
}

export interface IProviderInputData {
	value: string;
	options?: string[];
}

export interface IProviderInputProps {
	type: 'input';
	name: string;
	label?: string;
	data: () => Promise<IProviderInputData>;
}

export type IProviderProps = IProviderSelectProps | IProviderInputProps;
