<script lang="ts">
	import type { IProviderProps } from '../types';
	import ProviderOptionInput from './provider-option-input.svelte';
	import ProviderOptionSelect from './provider-option-select.svelte';

	export let className = '';
	export let data: string | undefined;
	export let props: IProviderProps;
	export let onUpdate: (data: Record<string, string>) => void;
</script>

<div class="inline-block whitespace-nowrap">
	{#if props.type === 'input'}
		<ProviderOptionInput {className} {data} {props} {onUpdate} />
	{:else if props.type === 'select'}
		<ProviderOptionSelect {className} {data} {props} {onUpdate} />
	{/if}
</div>
