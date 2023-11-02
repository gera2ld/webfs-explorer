<script context="module">
	let index = 0;

	function getId() {
		index += 1;
		return `input-${index}`;
	}
</script>

<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { IProviderInputData, IProviderInputProps } from '../types';

	export let className = '';
	export let data: string | undefined;
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
	<button on:click|preventDefault={handleClick}>
		<Icon icon="solar:pen-linear" />
	</button>
</label>
