import type { IPFS } from 'ipfs-core';
import type { IPFSNode, ISupportedUrl } from '../types';
import { arrayFromAsync, mergeUint8Array, createIpfs } from '../util';
import { IFileProvider } from './base';

export class IPFSProvider extends IFileProvider {
	static scheme = 'ipfs' as const;

	readOnly = true;

	private _root = '';
	private _ipfsPromise: Promise<IPFS> | undefined;

	private _loadIpfs() {
		this._ipfsPromise ||= createIpfs();
		return this._ipfsPromise;
	}

	setData(data: ISupportedUrl) {
		this.data = data;
		this._root = data.pathname;
	}

	async stat(ipfsPath: string) {
		return this._internalStat(ipfsPath);
	}

	async exists(filePath: string) {
		try {
			await this._internalStat(filePath);
			return true;
		} catch {
			return false;
		}
	}

	private _getFullPath(filePath: string) {
		const fullPath = [this._root, filePath].filter(Boolean).join('/');
		return fullPath;
	}

	private async _internalStat(filePath: string): Promise<IPFSNode> {
		const ipfs = await this._loadIpfs();
		const ipfsPath = await ipfs.resolve(this._getFullPath(filePath));
		const stat = await ipfs.files.stat(ipfsPath);
		return {
			name: filePath.split('/').pop() || '',
			cid: stat.cid.toString(),
			type: stat.type,
			size: stat.size,
			path: filePath,
		};
	}

	async readFile(filePath: string) {
		const ipfs = await this._loadIpfs();
		const ipfsPath = await ipfs.resolve(this._getFullPath(filePath));
		const buffer = await arrayFromAsync(ipfs.cat(ipfsPath));
		return mergeUint8Array(buffer);
	}

	async readDir(filePath: string) {
		const ipfs = await this._loadIpfs();
		const ipfsPath = await ipfs.resolve(this._getFullPath(filePath));
		const items = await arrayFromAsync(ipfs.ls(ipfsPath));
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
