<script lang="ts">
	import Icon from '@iconify/svelte';
	import MonacoEditor from '../components/monaco-editor.svelte';
	import ImageViewer from '../components/image-viewer.svelte';
	import { loading, activeNode, activeContent, provider, actions } from '../util/store';

	let getContent: () => string;

	function handleSave() {
		$actions.handleSave(getContent());
	}
</script>

{#if $provider}
	{#if $loading || ($activeNode && !$activeContent)}
		<div class="h-full flex items-center justify-center text-zinc-400">Loading...</div>
	{:else if !$activeContent || $activeContent.type === 'directory'}
		<div class="h-full flex items-center justify-center text-zinc-400">
			Pick a file to view / edit its content
		</div>
	{:else if $activeContent.type === 'text'}
		{#if !$provider.readOnly}
			<div class="px-4">
				<button class="mr-2" on:click={$actions.handleRevert}><Icon icon="ci:undo" /></button>
				<button class="mr-2" on:click={handleSave}><Icon icon="ic:sharp-save-alt" /></button>
			</div>
		{/if}
		<MonacoEditor
			class="flex-1"
			language={$activeContent.language}
			value={$activeContent.content}
			dirty={$activeNode?.dirty}
			readOnly={$provider.readOnly}
			bind:getContent
			on:change={() => {
				if ($activeNode) $activeNode.dirty = true;
			}}
		/>
	{:else if $activeContent.type === 'image'}
		<ImageViewer class="flex-1" name={$activeNode?.name} content={$activeContent.content} />
	{:else}
		<div class="p-4">
			<div>{$activeNode?.name}</div>
			<div>
				Unsupported file,
				<button on:click|preventDefault={$actions.handleDownload}>click to download</button>
			</div>
		</div>
	{/if}
{/if}
