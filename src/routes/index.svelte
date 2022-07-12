<script lang="ts">
	import { onMount } from 'svelte';
	import NodeTree from '../components/node-tree.svelte';
	import type { FSNode } from '../types';
	import { IPFSProvider } from '../provider';

	let provider: IPFSProvider;
	let root: FSNode | undefined;
	let active: FSNode | undefined;

	async function main() {
		const ipfs = await window.ipfsPromise;
		provider = new IPFSProvider(ipfs);
		await provider.openPath('/ipns/gera2ld.crypto');
		await provider.toggleNode(provider.root!);
		root = provider.root;
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

	onMount(main);
</script>

<div class="w-screen h-screen flex flex-col">
	<header class="border-b border-gray-400 px-4 py-2">
		> <input class="bg-transparent" placeholder="IPFS path" />
	</header>
	<div class="flex flex-1">
		<div class="w-[320px] border-r border-gray-400 p-4 overflow-auto">
			<NodeTree {root} bind:active {setActive} />
		</div>
		<div class="flex-1 p-2">
			{#if active?.type === 'file'}
				<textarea class="w-full h-full resize-none" value={active.content} />
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					Pick a file to view / edit its content
				</div>
			{/if}
		</div>
	</div>
</div>
