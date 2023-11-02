<script lang="ts">
	import { message } from '../util/store';
</script>

{#if $message}
	<div
		class={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 bg-zinc-100 dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-600 ${
			$message.type === 'error'
				? 'text-red-500 dark:text-red-600 border-red-500 dark:border-red-600'
				: 'dark:text-yellow-600'
		}`}
	>
		{$message.content}
	</div>
{/if}
