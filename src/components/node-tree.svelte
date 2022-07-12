<script lang="ts">
	import type { FSNode } from '../types';

	export let root: FSNode | undefined;
	export let active: FSNode | undefined;
	export let setActive: (node: FSNode) => void;

	function getNodes(node: FSNode, level = 0) {
		const nodes: Array<{ node: FSNode; level: number }> = [
			{ node, level },
			...(node.children || []).flatMap((child) => getNodes(child, level + 1))
		];
		return nodes;
	}

	$: items = root ? getNodes(root) : [];
</script>

<div class="w-full whitespace-nowrap text-ellipsis">
	{#each items as { node, level } (node.cid)}
		<div
			class={`flex items-center px-4 cursor-pointer ${
				active === node ? 'bg-gray-600 text-gray-200' : 'text-gray-400'
			}`}
			style={`padding-left:${8 * level}px`}
			on:click={() => setActive(node)}
		>
			{#if node.type === 'directory'}
				<svg
					viewBox="0 0 16 16"
					class={`w-4 h-4 transition-transform ${node.children ? 'rotate-90' : ''}`}
				>
					<path d="M6 2l6 6l-6 6z" stroke="none" fill="currentColor" />
				</svg>
			{:else}
				<svg viewBox="0 0 16 16" class="w-4 h-4">
					<path d="M4 3v1h8v-1zM4 6v1h4v-1zM4 9v1h8v-1zM4 12v1h6v-1z" stroke="none" fill="currentColor" />
				</svg>
			{/if}
			<span>{node.name}{node.type === 'directory' ? '/' : ''}</span>
		</div>
	{/each}
</div>
