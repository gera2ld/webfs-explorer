<script lang="ts">
	import { onMount } from 'svelte';
	import NodeTree from '../components/node-tree.svelte';
	import MonacoEditor from '../components/monaco-editor.svelte';
	import type { FSNode } from '../types';
	import { IPFSProvider } from '../provider';

	let provider: IPFSProvider;
	let root: FSNode | undefined;
	let active: FSNode | undefined;
	let inputPath: string = '';
	let loading = true;
	let activeContent: { type: string; data: string | null } | undefined;

	$: activeContent = active && getContent(active);

	function getContent(node: FSNode) {
		if (node.type === 'directory') return { type: 'directory', data: null };
		if (!node.content) return;
		const decoder = new TextDecoder();
		return {
			type: 'text',
			data: decoder.decode(node.content)
		};
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

	function handleOpen(e: SubmitEvent) {
		e.preventDefault();
		openPath(inputPath);
	}

	onMount(main);
</script>

<div class="w-screen h-screen flex flex-col">
	<header class="border-b border-gray-400 px-4 py-2">
		<form on:submit={handleOpen}>
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
			{#if loading || (active && !active.children && !active.content)}
				<div class="h-full flex items-center justify-center text-gray-400">Loading...</div>
			{:else if !active || active.children}
				<div class="h-full flex items-center justify-center text-gray-400">
					Pick a file to view / edit its content
				</div>
			{:else if activeContent?.type === 'text'}
				<MonacoEditor name={active.name} value={activeContent.data || ''} />
			{/if}
		</div>
	</div>
</div>
