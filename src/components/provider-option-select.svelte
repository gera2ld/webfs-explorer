<script lang="ts">
	import type { IProviderSelectData, IProviderSelectProps, ISupportedUrl } from '../types';

	export let className = '';
	export let data: ISupportedUrl | undefined;
	export let props: IProviderSelectProps;
	export let onUpdate: (data: Record<string, string>) => void;

	let value = '';
	let options: IProviderSelectData['options'] = [];

	$: if (data) loadProps();

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

	<select bind:value on:change={handleUpdate}>
		{#each options as item}
			<option value={item.value}>{item.title}</option>
		{/each}
	</select>
</label>
