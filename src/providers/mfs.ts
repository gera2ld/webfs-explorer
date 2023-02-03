import type { IPFSHTTPClient } from 'ipfs-http-client';
import type { CIDVersion } from 'multiformats/cid';
import type { IPFSNode, ISupportedUrl } from '../types';
import { arrayFromAsync, mergeUint8Array } from '../util';
import { IFileProvider } from './base';

const QS_API = 'api';

export class MFSProvider extends IFileProvider {
	static scheme = 'ipfs-mfs' as const;

	readOnly = false;

	private _ipfsOptions: { cidVersion: CIDVersion } = { cidVersion: 1 };
	private _root = '';
	private _ipfs: Promise<IPFSHTTPClient> | undefined;

	private async _loadIpfsOnce() {
		const { create } = await import('ipfs-http-client');
		return create({
			url:
				new URLSearchParams(window.location.hash.slice(1)).get(QS_API) || 'http://127.0.0.1:5001',
		});
	}

	private _loadIpfs() {
		this._ipfs ||= this._loadIpfsOnce();
		return this._ipfs;
	}

	setData(data: ISupportedUrl) {
		this.data = data;
		this._root = data.pathname;
	}

	async stat(filePath: string) {
		return this._internalStat(filePath);
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
		const stat = await ipfs.files.stat(this._getFullPath(filePath));
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
		const buffer = await arrayFromAsync(ipfs.files.read(this._getFullPath(filePath)));
		return mergeUint8Array(buffer);
	}

	async readDir(filePath: string) {
		const ipfs = await this._loadIpfs();
		const items = await arrayFromAsync(ipfs.files.ls(this._getFullPath(filePath)));
		const children = await Promise.all(
			items.map(({ name, cid, type, size }) => {
				const childPath = [filePath.replace(/\/$/, ''), name].join('/');
				return {
					name,
					cid: cid.toString(),
					type,
					size,
					path: childPath,
				} as IPFSNode;
			})
		);
		return children;
	}

	async writeFile(filePath: string, content: string) {
		const ipfs = await this._loadIpfs();
		await ipfs.files.write(this._getFullPath(filePath), content, {
			...this._ipfsOptions,
			create: true,
			truncate: true,
		});
	}

	async rename(sourcePath: string, filePath: string) {
		if (await this.exists(filePath)) throw new Error(`Path already exists: ${filePath}`);
		const ipfs = await this._loadIpfs();
		await ipfs.files.mv(
			this._getFullPath(sourcePath),
			this._getFullPath(filePath),
			this._ipfsOptions
		);
	}

	async delete(filePath: string) {
		const ipfs = await this._loadIpfs();
		await ipfs.files.rm(this._getFullPath(filePath), { recursive: true });
	}

	async mkdir(filePath: string) {
		const ipfs = await this._loadIpfs();
		await ipfs.files.mkdir(this._getFullPath(filePath), { ...this._ipfsOptions, parents: true });
	}
}
