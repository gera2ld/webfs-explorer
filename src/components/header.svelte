<script lang="ts">
	import Icon from '@iconify/svelte';
	import { actions, openPath, provider, rootUrl } from '../util/store';
	import ProviderOption from './provider-option.svelte';

	let inputPath = $state('');

	$effect(() => {
		if ($rootUrl) inputPath = $rootUrl;
	});

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		openPath(inputPath, '');
	}
</script>

{#if $provider}
	<header class="flex border-b border-zinc-400 px-4 py-2">
		<form onsubmit={handleSubmit}>
			<Icon icon="tabler:prompt" />
			<input class="w-[500px]" bind:value={inputPath} />
			<button type="submit" title="Go" class="mr-4"><Icon icon="bx:rocket" /></button>
			{#each $provider.options as option, i (i)}
				<ProviderOption
					class="mr-4"
					data={$rootUrl}
					props={option}
					onUpdate={$actions.handleUpdate}
				/>
			{/each}
		</form>
		<div class="flex-1"></div>
		<a class="ml-2" href="https://github.com/gera2ld/webfs-explorer" target="_blank">
			<Icon icon="bi:github" />
		</a>
	</header>
{/if}
