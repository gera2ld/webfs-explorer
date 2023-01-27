<script context="module">
	let index = 0;

	function getId() {
		index += 1;
		return `option-${index}`;
	}
</script>

<script lang="ts">
	import type { IProviderOption } from '../types';

	export let props: IProviderOption;
	export let value: string;
	export let onUpdate: () => void;

	const id = getId();
</script>

<label class="ml-4">
	{#if props.label}
		<span>{props.label}</span>
	{/if}

	{#if props.type === 'select'}
		<select bind:value class="bg-transparent border-b border-gray-300" on:change={onUpdate}>
			{#each props.data as item}
				<option value={item.value}>{item.title}</option>
			{/each}
		</select>
	{:else if props.type === 'input'}
		<input
			bind:value
			list={props.data ? id : null}
			class="bg-transparent border-b border-gray-300 text-inherit"
			on:change={onUpdate}
		/>
		{#if props.data}
			<datalist {id}>
				{#each props.data as item}
					<option>{item}</option>
				{/each}
			</datalist>
		{/if}
	{/if}
</label>
