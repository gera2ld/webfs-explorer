<script lang="ts">
	import type { IProviderProps, ISupportedUrl } from '../types';
	import ProviderOptionInput from './provider-option-input.svelte';
	import ProviderOptionSelect from './provider-option-select.svelte';

	export let data: ISupportedUrl | undefined;
	export let props: IProviderProps;
	export let onUpdate: (data: Record<string, string>) => void;
</script>

{#if props.type === 'input'}
	<ProviderOptionInput {data} {props} {onUpdate} />
{:else if props.type === 'select'}
	<ProviderOptionSelect {data} {props} {onUpdate} />
{/if}
