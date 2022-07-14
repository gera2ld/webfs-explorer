<script lang="ts">
	import { onMount } from 'svelte';
	import NodeTree from '../components/node-tree.svelte';
	import MonacoEditor from '../components/monaco-editor.svelte';
	import ImageViewer from '../components/image-viewer.svelte';
	import type { FSNode, FileData } from '../types';
	import { IPFSProvider } from '../util/provider';
	import { detectFile } from '../util/file-type';

	let provider: IPFSProvider;
	let root: FSNode | undefined;
	let active: FSNode | undefined;
	let inputPath: string = '';
	let loading = true;

	$: activeContent = active && getContent(active);

	function getContent(node: FSNode): FileData | undefined {
		if (node.type === 'directory' && node.children) return { type: 'directory', content: null };
		if (node.content) return detectFile(node.name, node.content);
	}

	/**
	 * Supported paths:
	 * - CID / /ipfs/CID
	 * - DOMAIN / /ipns/DOMAIN
	 * - CID:path/to/file / /ipfs/CID/path/to/file
	 * - DOMAIN:path/to/file / /ipns/DOMAIN/path/to/file
	 */
	async function openPath(path: string, name?: string) {
		if (loading) return;
		loading = true;
		active = undefined;
		let ipfsPath: string;
		let activePath: string;
		if (path.includes(':')) {
			[ipfsPath, activePath] = path.split(':');
		} else if (path.startsWith('/')) {
			const parts = path.split('/');
			ipfsPath = parts.slice(0, 3).join('/');
			activePath = parts.slice(3).join('/');
		} else {
			ipfsPath = path;
		}
		if (/^\w+$/.test(ipfsPath)) ipfsPath = `/ipfs/${ipfsPath}`;
		else if (ipfsPath.includes('.') && !ipfsPath.includes('/')) ipfsPath = `/ipns/${ipfsPath}`;
		try {
			const rootPath = await provider.openPath(ipfsPath, name);
			root = provider.root;
			inputPath = root?.cid?.toString() || '';
			setActive(await provider.setActivePath(activePath ?? rootPath), true);
			console.log('root CID:', inputPath);
		} catch (err) {
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function main() {
		const ipfs = await window.ipfsPromise;
		provider = new IPFSProvider(ipfs);
		loading = false;
		const params = new URLSearchParams(window.location.hash.slice(1));
		const path = params.get('p') || 'gera2ld.crypto';
		await openPath(path, params.get('n'));
	}

	async function setActive(node: FSNode, toggle?: boolean) {
		console.log('setActive:', node.path);
		active = node;
		if (node.type === 'file') {
			await provider.loadNode(node);
		} else {
			await provider.toggleNode(node, toggle);
			root = root;
		}
		active = active;
		if (root) {
			const params = new URLSearchParams(window.location.hash.slice(1));
			params.set('p', [root.cid.toString(), node.path].filter(Boolean).join(':'));
			window.location.hash = params.toString();
		}
	}

	function handleOpen() {
		openPath(inputPath);
	}

	function handleDownload() {
		if (!(activeContent?.content instanceof Uint8Array)) return;
		const blob = new Blob([activeContent.content]);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		if (active?.name) a.download = active.name;
		a.click();
		setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 2000);
	}

	onMount(main);
</script>

<div class="w-screen h-screen flex flex-col">
	<header class="border-b border-gray-400 px-4 py-2">
		<form on:submit|preventDefault={handleOpen}>
			> <input
				class="bg-transparent w-[400px] border-b border-gray-300 text-xs"
				placeholder="IPFS path"
				bind:value={inputPath}
			/>
			<button type="submit">👉🏻 Go</button>
		</form>
	</header>
	<div class="flex flex-1 min-h-0">
		<div class="w-[320px] border-r border-gray-400 p-4 overflow-auto">
			{#if loading}
				<div class="text-gray-400">Loading...</div>
			{:else}
				<NodeTree {root} bind:active {setActive} />
			{/if}
		</div>
		<div class="flex-1">
			{#if loading || (active && !activeContent)}
				<div class="h-full flex items-center justify-center text-gray-400">Loading...</div>
			{:else if !activeContent || activeContent.type === 'directory'}
				<div class="h-full flex items-center justify-center text-gray-400">
					Pick a file to view / edit its content
				</div>
			{:else if activeContent.type === 'text'}
				<MonacoEditor language={activeContent.language} value={activeContent.content} />
			{:else if activeContent.type === 'image'}
				<ImageViewer name={active?.name} content={activeContent.content} />
			{:else}
				<div class="p-4">
					<div>{active?.name}</div>
					<div>
						Unsupported file, <a href="#" on:click|preventDefault={handleDownload}
							>click to download</a
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
