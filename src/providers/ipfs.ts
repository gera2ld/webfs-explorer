import type { IPFS } from 'ipfs-core';
import type { IPFSNode, ISupportedUrl } from '../types';
import { arrayFromAsync, mergeUint8Array, createIpfs } from '../util';
import { IFileProvider } from './base';

export class IPFSProvider extends IFileProvider {
	readOnly = true;

	constructor(private ipfs: IPFS, private root: string) {
		super();
	}

	async stat(ipfsPath: string) {
		return this.internalStat(ipfsPath);
	}

	async exists(filePath: string) {
		try {
			await this.internalStat(filePath);
			return true;
		} catch {
			return false;
		}
	}

	private getFullPath(filePath: string) {
		const fullPath = [this.root, filePath].filter(Boolean).join('/');
		return fullPath;
	}

	private async internalStat(filePath: string): Promise<IPFSNode> {
		const ipfsPath = await this.ipfs.resolve(this.getFullPath(filePath));
		const stat = await this.ipfs.files.stat(ipfsPath);
		return {
			name: filePath.split('/').pop() || '',
			cid: stat.cid.toString(),
			type: stat.type,
			size: stat.size,
			path: filePath,
		};
	}

	async readFile(filePath: string) {
		const ipfsPath = await this.ipfs.resolve(this.getFullPath(filePath));
		const buffer = await arrayFromAsync(this.ipfs.cat(ipfsPath));
		return mergeUint8Array(buffer);
	}

	async readDir(filePath: string) {
		const ipfsPath = await this.ipfs.resolve(this.getFullPath(filePath));
		const items = await arrayFromAsync(this.ipfs.ls(ipfsPath));
		const children = await Promise.all(
			items.map(({ name, cid, type, size }) => {
				const childPath = [filePath.replace(/\/$/, ''), name].join('/');
				return {
					name,
					cid: cid.toString(),
					type: type === 'file' ? 'file' : 'directory',
					size,
					path: childPath,
				} as IPFSNode;
			})
		);
		return children;
	}
}

export async function create(data: ISupportedUrl) {
	const ipfs = await createIpfs();
	return new IPFSProvider(ipfs, data.pathname);
}
