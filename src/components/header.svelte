<script lang="ts">
	import Icon from '@iconify/svelte';
	import {
		openPath,
		provider,
		rootUrl,
		actions,
		activeContent,
		activeNode,
		showMessage,
	} from '../util/store';
	import { truncateText } from '../util/util';
	import ProviderOption from './provider-option.svelte';

	let inputPath = '';

	$: inputPath = $rootUrl;

	function handleCopy(e: MouseEvent) {
		const el = (e.target as HTMLElement).closest('[data-text]') as HTMLElement;
		const text = el?.dataset.text;
		if (text) {
			navigator.clipboard.writeText(text);
			showMessage(`Copied ${truncateText(text, 30, 4)}`);
		}
	}
</script>

{#if $provider}
	<header class="flex border-b border-zinc-400 px-4 py-2">
		<form on:submit|preventDefault={() => openPath(inputPath, '')}>
			<Icon icon="tabler:prompt" />
			<input class="w-[500px]" bind:value={inputPath} />
			<button type="submit" title="Go" class="mr-4"><Icon icon="bx:rocket" /></button>
			{#each $provider.options as option}
				<ProviderOption
					className="mr-4"
					data={$rootUrl}
					props={option}
					onUpdate={$actions.handleUpdate}
				/>
			{/each}
		</form>
		<div class="flex-1" />
		{#if $activeContent && $activeNode?.cid}
			<button class="ml-2" data-text={$activeNode.cid} on:click|preventDefault={handleCopy}
				>CID</button
			>
			<button
				class="ml-2"
				data-text={`https://dweb.link/ipfs/${$activeNode.cid}`}
				on:click|preventDefault={handleCopy}
			>
				URL
			</button>
		{/if}
		<a class="ml-2" href="https://github.com/gera2ld/webfs-explorer" target="_blank">
			<Icon icon="bi:github" />
		</a>
	</header>
{/if}
