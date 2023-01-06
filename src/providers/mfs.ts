import type { IPFSHTTPClient } from 'ipfs-http-client';
import type { CIDVersion } from 'multiformats/cid';
import type { IPFSNode, ISupportedUrl } from '../types';
import { arrayFromAsync, mergeUint8Array } from '../util';
import { IFileProvider } from './base';

const QS_API = 'api';

export class MFSProvider extends IFileProvider {
	readOnly = false;

	private ipfsOptions: { cidVersion: CIDVersion } = { cidVersion: 1 };
	private root: string;

	constructor(data: ISupportedUrl, private ipfs: IPFSHTTPClient) {
		super(data);
		this.root = data.pathname;
	}

	async stat(filePath: string) {
		return this.internalStat(filePath);
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
		const stat = await this.ipfs.files.stat(this.getFullPath(filePath));
		return {
			name: filePath.split('/').pop() || '',
			cid: stat.cid.toString(),
			type: stat.type,
			size: stat.size,
			path: filePath,
		};
	}

	async readFile(filePath: string) {
		const buffer = await arrayFromAsync(this.ipfs.files.read(this.getFullPath(filePath)));
		return mergeUint8Array(buffer);
	}

	async readDir(filePath: string) {
		const items = await arrayFromAsync(this.ipfs.files.ls(this.getFullPath(filePath)));
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
		await this.ipfs.files.write(this.getFullPath(filePath), content, {
			...this.ipfsOptions,
			create: true,
			truncate: true,
		});
	}

	async rename(sourcePath: string, filePath: string) {
		if (await this.exists(filePath)) throw new Error(`Path already exists: ${filePath}`);
		await this.ipfs.files.mv(
			this.getFullPath(sourcePath),
			this.getFullPath(filePath),
			this.ipfsOptions
		);
	}

	async delete(filePath: string) {
		await this.ipfs.files.rm(this.getFullPath(filePath), { recursive: true });
	}

	async mkdir(filePath: string) {
		await this.ipfs.files.mkdir(this.getFullPath(filePath), { ...this.ipfsOptions, parents: true });
	}
}

export async function create(data: ISupportedUrl) {
	const { create } = await import('ipfs-http-client');
	const ipfs = create({
		url: new URLSearchParams(window.location.hash.slice(1)).get(QS_API) || 'http://127.0.0.1:5001',
	});
	return new MFSProvider(data, ipfs);
}
