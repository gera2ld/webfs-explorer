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
			resolvedPath: ''
		};
	}

	get root() {
		return this.state.root;
	}

	async resetRoot() {
		try {
			await this.ipfs.files.rm(this.rootDir, { recursive: true });
			console.log('reset root');
		} catch {
			// ignore
		}
	}

	async openPath(ipfsPath: string) {
		console.log('resolve path:', ipfsPath);
		const resolvedPath = await this.ipfs.resolve(ipfsPath);
		console.log('resolved:', resolvedPath);
		this.state = {
			path: ipfsPath,
			resolvedPath
		};
		const root = await this.stat(resolvedPath);
		console.log('loaded path:', root);
		await this.resetRoot();
		if (root.type === 'file') {
			await this.ipfs.files.mkdir(this.rootDir);
			await this.ipfs.files.cp(resolvedPath, this.rootDir + '/file');
			console.log('loaded file', resolvedPath);
		} else {
			await this.ipfs.files.cp(resolvedPath, this.rootDir);
			console.log('loaded directory:', resolvedPath);
		}
		this.state.root = await this.stat(this.rootDir, 'root');
		console.log('root ready:', this.state.root);
	}

	async stat(filePath: string, name = 'noname') {
		const stat = await this.ipfs.files.stat(filePath);
		return {
			name,
			path: filePath,
			cid: stat.cid.toString(),
			type: stat.type,
			size: stat.size
		} as FSNode;
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

	async toggleNode(node: FSNode) {
		if (node.type !== 'directory') return;
		if (!node.children) {
			const children: FSNode[] = [];
			for await (const { name } of this.ipfs.files.ls(node.path)) {
				children.push(await this.stat(`${node.path}/${name}`, name));
			}
			node.children = children;
			console.log('loaded dir:', node.path);
		}
		node.expand = !node.expand;
	}
}
