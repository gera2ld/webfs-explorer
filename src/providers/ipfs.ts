import type { IPFS } from 'ipfs-core';
import type { FSNode, IFileProvider } from '../types';
import { arrayFromAsync, mergeUint8Array, createIpfs } from '../util';

export class IPFSProvider implements IFileProvider {
	readOnly = true;

	static async create() {
		const ipfs = await createIpfs();
		return new IPFSProvider(ipfs);
	}

	constructor(private ipfs: IPFS) {
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

	private async internalStat(filePath: string): Promise<FSNode> {
		const ipfsPath = await this.ipfs.resolve(filePath);
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
		const ipfsPath = await this.ipfs.resolve(filePath);
		const buffer = await arrayFromAsync(this.ipfs.cat(ipfsPath));
		return mergeUint8Array(buffer);
	}

	async readDir(filePath: string) {
		const ipfsPath = await this.ipfs.resolve(filePath);
		const items = await arrayFromAsync(this.ipfs.ls(ipfsPath));
		const children = await Promise.all(items.map(({ name, cid, type, size }) => {
			const childPath = [filePath.replace(/\/$/, ''), name].join('/');
			return {
				name,
				cid: cid.toString(),
				type: type === 'file' ? 'file' : 'directory',
				size,
				path: childPath,
			} as FSNode;
		}));
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
