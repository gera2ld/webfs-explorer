<script lang="ts">
	import { onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor';

	export let language: string = '';
	export let value: string;
	let el: HTMLDivElement;
	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;

	$: editor?.setValue(value || '');
	$: if (editor && monaco) monaco.editor.setModelLanguage(editor.getModel()!, language || '');

	function updateTheme(dark: boolean) {
		monaco.editor.setTheme(dark ? 'vs-dark' : 'vs');
	}

	onMount(async () => {
		monaco = await window.monacoPromise;
		const result = window.matchMedia('(prefers-color-scheme: dark)');
		updateTheme(result.matches);
		result.onchange = (e) => {
			updateTheme(e.matches);
		};
		editor = monaco.editor.create(el, {
			value: '',
			automaticLayout: true,
		});
	});
</script>

<div class="w-full h-full" bind:this={el} />
