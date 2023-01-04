import type { IPFS } from 'ipfs-core';
import type { IPFSNode, IFileProvider, ISupportedUrl } from '../types';
import { arrayFromAsync, mergeUint8Array, createIpfs } from '../util';

export class IPFSProvider implements IFileProvider {
	readOnly = true;

	constructor(private ipfs: IPFS, private root: string) {}

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

export async function create(data: ISupportedUrl) {
	const ipfs = await createIpfs();
	return new IPFSProvider(ipfs, data.pathname);
}
