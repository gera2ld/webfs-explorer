import { create } from 'ipfs-http-client';
import type { IPFSHTTPClient } from 'ipfs-http-client';
import type { CIDVersion } from 'multiformats/cid';
import type { FSNode, IFileProvider } from '../types';
import { arrayFromAsync, mergeUint8Array } from '../util';

const QS_API = 'api';

export class MFSProvider implements IFileProvider {
	private ipfsOptions: { cidVersion: CIDVersion } = { cidVersion: 1 };

	readOnly = false;

	static async create() {
		const ipfs = create({
			url:
				new URLSearchParams(window.location.hash.slice(1)).get(QS_API) || 'http://127.0.0.1:5001',
		});
		return new MFSProvider(ipfs);
	}

	constructor(private ipfs: IPFSHTTPClient) {}

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

	private async internalStat(filePath: string): Promise<FSNode> {
		const stat = await this.ipfs.files.stat(filePath);
		return {
			name: filePath.split('/').pop() || '',
			cid: stat.cid.toString(),
			type: stat.type,
			size: stat.size,
			path: filePath,
		};
	}

	async readFile(filePath: string) {
		const buffer = await arrayFromAsync(this.ipfs.files.read(filePath));
		return mergeUint8Array(buffer);
	}

	async readDir(filePath: string) {
		const items = await arrayFromAsync(this.ipfs.files.ls(filePath));
		const children = await Promise.all(
			items.map(({ name, cid, type, size }) => {
				const childPath = [filePath.replace(/\/$/, ''), name].join('/');
				return {
					name,
					cid: cid.toString(),
					type,
					size,
					path: childPath,
				} as FSNode;
			})
		);
		return children;
	}

	async writeFile(filePath: string, content: string) {
		await this.ipfs.files.write(filePath, content, {
			...this.ipfsOptions,
			create: true,
			truncate: true,
		});
	}

	async rename(sourcePath: string, filePath: string) {
		if (await this.exists(filePath)) throw new Error(`Path already exists: ${filePath}`);
		await this.ipfs.files.mv(sourcePath, filePath, this.ipfsOptions);
	}

	async delete(filePath: string) {
		await this.ipfs.files.rm(filePath, { recursive: true });
	}

	async mkdir(filePath: string) {
		await this.ipfs.files.mkdir(filePath, { ...this.ipfsOptions, parents: true });
	}
}
