<script context="module">
	let index = 0;

	function getId() {
		index += 1;
		return `input-${index}`;
	}
</script>

<script lang="ts">
	import type { IProviderInputData, IProviderInputProps, ISupportedUrl } from '../types';

	export let className = '';
	export let data: ISupportedUrl | undefined;
	export let props: IProviderInputProps;
	export let onUpdate: (data: Record<string, string>) => void;

	let value = '';
	let options: IProviderInputData['options'] = [];

	const id = getId();

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

	<input bind:value list={options ? id : null} on:change={handleUpdate} />
	{#if options}
		<datalist {id}>
			{#each options as item}
				<option>{item}</option>
			{/each}
		</datalist>
	{/if}
</label>
