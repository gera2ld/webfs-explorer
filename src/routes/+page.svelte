<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '../components/header.svelte';
	import Message from '../components/message.svelte';
	import FileList from '../components/file-list.svelte';
	import MainArea from '../components/main-area.svelte';
	import { onHashChange } from '../util/store';

	onMount(() => {
		window.addEventListener('hashchange', onHashChange, false);
		onHashChange();
		return () => {
			window.removeEventListener('hashchange', onHashChange, false);
		};
	});
</script>

<div class="w-screen h-screen flex flex-col">
	<Header />
	<div class="flex flex-1 min-h-0">
		<div class="flex flex-col w-[320px] border-r border-zinc-400 px-4 overflow-auto">
			<FileList />
		</div>
		<div class="flex-1 min-w-0 flex flex-col">
			<MainArea />
		</div>
	</div>
</div>
<Message />
