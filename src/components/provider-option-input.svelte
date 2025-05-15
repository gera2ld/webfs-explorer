<script lang="ts">
	import Icon from '@iconify/svelte';
	import { untrack } from 'svelte';
	import type { IProviderInputProps } from '../types';

	let {
		class: className = '',
		data,
		props,
		onUpdate,
	}: {
		class?: string;
		data?: string;
		props: IProviderInputProps;
		onUpdate: (data: Record<string, string>) => void;
	} = $props();

	let value = $state('');

	$effect(() => {
		if (data) untrack(loadProps);
	});

	async function loadProps() {
		({ value } = await props.data());
	}

	function handleClick(e: MouseEvent) {
		e.preventDefault();
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
	<button onclick={handleClick}>
		<Icon icon="solar:pen-linear" />
	</button>
</label>
