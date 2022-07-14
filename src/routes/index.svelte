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

	async function openPath(path: string) {
		if (loading) return;
		loading = true;
		active = undefined;
		let ipfsPath: string;
		if (/^\w+$/.test(path)) ipfsPath = `/ipfs/${path}`;
		else if (path.includes('.') && !path.includes('/')) ipfsPath = `/ipns/${path}`;
		else ipfsPath = path;
		try {
			await provider.openPath(ipfsPath);
			await provider.toggleNode(provider.root!);
			root = provider.root;
			inputPath = root?.cid?.toString() || '';
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
		await openPath(path);
	}

	async function setActive(node: FSNode) {
		active = node;
		if (node.type === 'file') {
			await provider.loadNode(node);
			active = active;
		} else {
			await provider.toggleNode(node);
			root = root;
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
