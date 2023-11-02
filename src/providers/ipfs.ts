import { CID } from 'multiformats';
import type { IPFSNode, ISupportedUrl } from '../types';
import { arrayFromAsync, mergeUint8Array, loadIpfs } from '../util';
import { IFileProvider } from './base';

export class IPFSProvider extends IFileProvider {
	static scheme = 'ipfs' as const;

	readOnly = true;

	private _root = '';

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

	private async _resolve(ipfsPath: string) {
		const [scheme, host, ...rest] = ipfsPath.split('/');
		const { fs, ipns } = await loadIpfs();
		let cid: CID;
		if (scheme === 'ipns') {
			cid = await ipns.resolveDns(host);
		} else {
			cid = CID.parse(host);
		}
		const path = rest.filter(Boolean).join('/');
		if (path) {
			const res = await fs.stat(cid, { path });
			cid = res.cid;
		}
		return cid;
	}

	private async _internalStat(filePath: string): Promise<IPFSNode> {
		const { fs } = await loadIpfs();
		const cid = await this._resolve(this._getFullPath(filePath));
		const stat = await fs.stat(cid);
		return {
			name: filePath.split('/').pop() || '',
			cid: stat.cid.toString(),
			type: stat.type as IPFSNode['type'],
			size: stat.fileSize,
			path: filePath,
		};
	}

	async readFile(filePath: string) {
		const { fs } = await loadIpfs();
		const cid = await this._resolve(this._getFullPath(filePath));
		const buffer = await arrayFromAsync(fs.cat(cid));
		return mergeUint8Array(buffer);
	}

	async readDir(filePath: string) {
		const { fs } = await loadIpfs();
		const cid = await this._resolve(this._getFullPath(filePath));
		const items = await arrayFromAsync(fs.ls(cid));
		const children = await Promise.all(
			items.map(({ name, cid, type, size }): IPFSNode => {
				const childPath = [filePath.replace(/\/$/, ''), name].join('/');
				return {
					name,
					cid: cid.toString(),
					type: type === 'directory' ? 'directory' : 'file',
					size,
					path: childPath,
				};
			}),
		);
		return children;
	}
}
