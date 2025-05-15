<script lang="ts">
	import { untrack } from 'svelte';
	import type { IProviderSelectData, IProviderSelectProps } from '../types';

	let {
		class: className = '',
		data,
		props,
		onUpdate,
	}: {
		class?: string;
		data?: string;
		props: IProviderSelectProps;
		onUpdate: (data: Record<string, string>) => void;
	} = $props();

	let value = $state('');
	let options = $state<IProviderSelectData['options']>([]);

	$effect(() => {
		if (data) untrack(loadProps);
	});

	async function loadProps() {
		({ value, options } = await props.data());
	}

	function handleUpdate() {
		onUpdate({
			[props.name]: value,
		});
	}
</script>

<label class={className}>
	{#if props.label}
		<span>{props.label}</span>
	{/if}

	<select bind:value onchange={handleUpdate}>
		{#each options as item, i (i)}
			<option value={item.value}>{item.title}</option>
		{/each}
	</select>
</label>
