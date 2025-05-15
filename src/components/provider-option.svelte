<script lang="ts">
	import type { IProviderProps } from '../types';
	import ProviderOptionInput from './provider-option-input.svelte';
	import ProviderOptionSelect from './provider-option-select.svelte';

	let {
		class: className = '',
		data,
		props,
		onUpdate,
	}: {
		class?: string;
		data?: string;
		props: IProviderProps;
		onUpdate: (data: Record<string, string>) => void;
	} = $props();
</script>

<div class="inline-block whitespace-nowrap">
	{#if props.type === 'input'}
		<ProviderOptionInput class={className} {data} {props} {onUpdate} />
	{:else if props.type === 'select'}
		<ProviderOptionSelect class={className} {data} {props} {onUpdate} />
	{/if}
</div>
