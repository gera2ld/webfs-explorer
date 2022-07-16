import type { IPFS } from 'ipfs-core';
import type { FSNode } from '../types';

export class IPFSProvider {
	private state: {
		path: string;
		resolvedPath: string;
		root?: FSNode;
	};

	constructor(private ipfs: IPFS, private rootDir = '/root') {
		this.state = {
			path: '',
			resolvedPath: '',
		};
	}

	get root() {
		return this.state.root;
	}

	async resetRoot() {
		try {
			await this.ipfs.files.rm(this.rootDir, { recursive: true, cidVersion: 1 });
			console.log('reset root');
		} catch {
			// ignore
		}
	}

	async openPath(ipfsPath: string, name?: string) {
		console.log('resolve path:', ipfsPath);
		const resolvedPath = await this.ipfs.resolve(ipfsPath);
		console.log('resolved:', resolvedPath);
		this.state = {
			path: ipfsPath,
			resolvedPath,
		};
		const root = await this.internalStat(resolvedPath);
		console.log('loaded path:', root);
		await this.resetRoot();
		let activePath = '';
		if (root.type === 'file') {
			name ||= 'file';
			await this.ipfs.files.mkdir(this.rootDir, { cidVersion: 1 });
			await this.ipfs.files.cp(resolvedPath, this.rootDir + '/' + name, { cidVersion: 1 });
			activePath = name;
			console.log('loaded file', resolvedPath);
		} else {
			await this.ipfs.files.cp(resolvedPath, this.rootDir, { cidVersion: 1 });
			console.log('loaded directory:', resolvedPath);
		}
		this.state.root = await this.stat('', 'root');
		console.log('root ready:', this.state.root);
		return activePath;
	}

	async setActivePath(filePath: string) {
		console.log('active path:', filePath);
		const parts = filePath.split('/').filter(Boolean);
		let node = this.root;
		for (const part of parts) {
			if (!node) break;
			await this.toggleNode(node, true);
			const child = part && node?.children?.find((child) => child.name === part);
			if (!child) break;
			node = child;
		}
		return node;
	}

	async stat(relPath: string, name = 'noname') {
		const node = await this.internalStat(this.rootDir + relPath, name);
		return {
			...node,
			path: relPath,
		};
	}

	private async internalStat(filePath: string, name = 'noname') {
		const stat = await this.ipfs.files.stat(filePath);
		return {
			name,
			cid: stat.cid.toString(),
			type: stat.type,
			size: stat.size,
		};
	}

	private mergeUint8Array(arrays: Uint8Array[]) {
		const length = arrays.reduce((prev, arr) => prev + arr.length, 0);
		const output = new Uint8Array(length);
		let offset = 0;
		for (const arr of arrays) {
			output.set(arr, offset);
			offset += arr.length;
		}
		return output;
	}

	async loadFile(ipfsPath: string) {
		const buffer: Uint8Array[] = [];
		for await (const chunk of this.ipfs.cat(ipfsPath)) {
			buffer.push(chunk);
		}
		return this.mergeUint8Array(buffer);
	}

	async loadNode(node: FSNode) {
		if (node.type !== 'file') return;
		console.log('Load file:', node.path);
		node.content = await this.loadFile(`/ipfs/${node.cid}`);
		console.log('Loaded file:', node.path);
	}

	async toggleNode(node: FSNode, expand?: boolean) {
		if (node.type !== 'directory') return;
		if (!node.children) {
			const children: FSNode[] = [];
			for await (const { name } of this.ipfs.files.ls(this.rootDir + node.path)) {
				children.push(await this.stat(`${node.path}/${name}`, name));
			}
			node.children = children;
			console.log('loaded dir:', node.path);
		}
		node.expand = expand == null ? !node.expand : expand;
		console.log('toggle:', node, node.expand);
	}
}
