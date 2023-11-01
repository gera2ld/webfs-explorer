<script context="module">
	let index = 0;

	function getId() {
		index += 1;
		return `input-${index}`;
	}
</script>

<script lang="ts">
	import Icon from '@iconify/svelte';
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

	function handleClick() {
		const newValue = prompt(props.label, value);
		if (newValue == null) return;
		value = newValue;
		onUpdate({
			[props.name]: value,
		});
	}
</script>

<label class={className}>
	{#if props.label}
		<span>{props.label}</span>
	{/if}

	<input {value} readonly />
	<a href="#" on:click={handleClick}>
		<Icon icon="solar:pen-linear" />
	</a>
</label>
