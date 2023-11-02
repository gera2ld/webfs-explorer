<script lang="ts">
	import Icon from '@iconify/svelte';
	import {
		actions,
		loading,
		provider,
		rootNode,
		rootUrl,
		activeNode,
		openPath,
	} from '../util/store';
	import NodeTree from './node-tree.svelte';

	let action = '';

	function createAction(name: string) {
		return () => {
			action = name;
		};
	}
	function handleNewDir(e: CustomEvent<string>) {
		$actions.handleNewDir(e.detail);
	}
	function handleNewFile(e: CustomEvent<string>) {
		$actions.handleNewFile(e.detail);
	}
	function handleRename(e: CustomEvent<string>) {
		$actions.handleRename(e.detail);
	}
	function handleSetActive(e: CustomEvent<string>) {
		openPath($rootUrl, e.detail);
	}
	function handleToggle() {
		const node = $activeNode;
		if (!node) return;
		node.expand = !node.expand;
		activeNode.set(node);
	}
</script>

{#if $provider}
	{#if !$provider.readOnly}
		<div class="text-right">
			<button class="ml-2" on:click={createAction('newDir')}>
				<Icon icon="ant-design:folder-add-outlined" />
			</button>
			<button class="ml-2" on:click={createAction('newFile')}>
				<Icon icon="ant-design:file-add-outlined" />
			</button>
			<button class="ml-2" on:click={createAction('rename')}>
				<Icon icon="fluent-mdl2:rename" />
			</button>
			<button class="ml-2" on:click={$actions.handleDelete}>
				<Icon icon="bx:trash" />
			</button>
		</div>
	{/if}
	<div class="flex-1 pb-4">
		{#if $loading}
			<div class="text-zinc-400">Loading...</div>
		{:else}
			<NodeTree
				root={$rootNode}
				active={$activeNode}
				bind:action
				on:setActive={handleSetActive}
				on:toggle={handleToggle}
				on:cancel={createAction('')}
				on:rename={handleRename}
				on:newDir={handleNewDir}
				on:newFile={handleNewFile}
			/>
		{/if}
	</div>
{/if}
