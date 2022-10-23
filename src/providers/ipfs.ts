import { create } from 'ipfs-http-client';
import type { IPFSHTTPClient } from 'ipfs-http-client';
import type { FSNode, IFileProvider } from '../types';
import { arrayFromAsync, mergeUint8Array } from '../util';

export class IPFSProvider implements IFileProvider {
	private ipfs: IPFSHTTPClient;

	readOnly = true;

	constructor() {
		this.ipfs = create({
			url: 'http://127.0.0.1:5001',
		});
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

	private async internalStat(path: string): Promise<FSNode> {
		const items = await arrayFromAsync(this.ipfs.ls(path));
		const type = items[0]?.path === path ? 'file' : 'directory';
		const ipfsPath = await this.ipfs.resolve(path);
		return {
			name: path,
			cid: ipfsPath.split('/').pop() || '',
			type,
			size: 0,
			path: path,
		};
	}

	async readFile(ipfsPath: string) {
		const buffer = await arrayFromAsync(this.ipfs.cat(ipfsPath));
		return mergeUint8Array(buffer);
	}

	async readDir(ipfsPath: string) {
		const items = await arrayFromAsync(this.ipfs.ls(ipfsPath));
		const children = await Promise.all(items.map(({ name, cid, type, size }) => {
			const childPath = [ipfsPath.replace(/\/$/, ''), name].join('/');
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
