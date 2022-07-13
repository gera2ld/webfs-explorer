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

	async function openPath(path: string) {
		if (loading) return;
		loading = true;
		active = undefined;
		try {
			await provider.openPath(path);
			await provider.toggleNode(provider.root!);
			root = provider.root;
			inputPath = root?.cid?.toString() || '';
		} finally {
			loading = false;
		}
	}

	async function main() {
		const ipfs = await window.ipfsPromise;
		provider = new IPFSProvider(ipfs);
		loading = false;
		await openPath('/ipns/gera2ld.crypto');
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
		let ipfsPath: string;
		if (/^\w+$/.test(inputPath)) ipfsPath = `/ipfs/${inputPath}`;
		else if (inputPath.includes('.') && !inputPath.includes('/')) ipfsPath = `/ipns/${inputPath}`;
		else ipfsPath = inputPath;
		openPath(ipfsPath);
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
			{#if active?.type === 'file'}
				<MonacoEditor name={active.name} value={active.content || ''} />
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					{loading ? 'Loading...' : 'Pick a file to view / edit its content'}
				</div>
			{/if}
		</div>
	</div>
</div>
