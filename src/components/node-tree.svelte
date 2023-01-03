<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import type { FSNode } from '../types';

	const dispatch = createEventDispatcher();

	export let root: FSNode | undefined;
	export let active: FSNode | undefined;
	export let action = '';
	let items: ReturnType<typeof getNodes>;
	let elInput: HTMLInputElement;
	let context: {
		node: FSNode;
		value: string;
	} | null;
	let newNode: FSNode | null;

	type TreeNode = Omit<FSNode, 'type'> & { type: string };

	function loadingNode(path: string) {
		return {
			type: 'loading',
			path: `!loading!${path}`,
			cid: '',
			name: 'Loading...',
			size: 0,
			parent: active,
		};
	}

	function getNodes(node: FSNode, level = 0) {
		const nodes: Array<{ node: TreeNode; level: number }> = [{ node, level }];
		if (node.expand) {
			if (node.children) {
				nodes.push(...node.children.flatMap((child) => getNodes(child, level + 1)));
			} else {
				nodes.push({ node: loadingNode(node.path), level: level + 1 });
			}
		}
		if (newNode?.parent === node) {
			nodes.push({ node: newNode, level: level + 1 });
		}
		return nodes;
	}

	async function handleRename() {
		if (!active) return;
		const value = active.name || 'noname';
		context = { node: active, value };
	}

	async function handleConfirm() {
		if (!context) return;
		const { value } = context;
		if (!value) return handleCancel();
		handleClean();
		if (action === 'rename') dispatch('rename', value);
		else if (action === 'newDir') dispatch('newDir', value);
		else if (action === 'newFile') dispatch('newFile', value);
	}

	function handleClean() {
		context = null;
		newNode = null;
	}

	function handleCancel() {
		dispatch('cancel');
		handleClean();
	}

	async function handleKey(e: KeyboardEvent) {
		if (e.code === 'Escape') {
			e.preventDefault();
			handleCancel();
			return;
		}
		if (e.code === 'Enter') {
			e.preventDefault();
			handleConfirm();
			return;
		}
	}

	function handleNew(type: 'directory' | 'file') {
		if (!active) return;
		newNode = {
			type,
			path: '!new!',
			name: '',
			size: 0,
			parent: active,
		};
		context = {
			node: newNode,
			value: '',
		};
	}

	function handleAction() {
		if (action === 'rename') handleRename();
		else if (action === 'newDir') handleNew('directory');
		else if (action === 'newFile') handleNew('file');
	}

	function handleActivate(node: TreeNode) {
		if (context?.node === node) return;
		if (['file', 'directory'].includes(node.type)) dispatch('setActive', node);
	}

	$: if (action) handleAction();
	$: {
		// refresh when deps are changed
		active;
		newNode;
		items = root ? getNodes(root) : [];
	}
	$: if (elInput) {
		elInput.focus();
		elInput.select();
	}
</script>

<div class="w-full">
	{#each items as { node, level } (node.path)}
		<div
			class={`flex items-center px-4 cursor-pointer ${
				active === node ? 'bg-gray-600 text-gray-200' : 'text-gray-400'
			}`}
			style={`padding-left:${16 * level}px`}
			title={node.name}
			on:click={() => handleActivate(node)}
		>
			{#if node.type === 'directory'}
				<svg
					viewBox="0 0 16 16"
					class={`w-4 h-4 transition-transform ${node.expand ? 'rotate-90' : ''}`}
				>
					<path d="M6 2l6 6l-6 6z" stroke="none" fill="currentColor" />
				</svg>
			{:else if node.type === 'file'}
				<Icon icon="ant-design:file-text-outlined" />
			{/if}
			{#if context?.node === node}
				<input
					bind:this={elInput}
					class="flex-1 min-w-0 px-1 bg-gray-400 dark:bg-gray-900"
					bind:value={context.value}
					on:keydown={handleKey}
					on:blur={handleConfirm}
					on:click|stopPropagation
				/>
			{:else}
				<span class="flex-1 truncate">
					{node.dirty ? '* ' : ''}{node.name}{node.type === 'directory' ? '/' : ''}
				</span>
			{/if}
		</div>
	{/each}
</div>
