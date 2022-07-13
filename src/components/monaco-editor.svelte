<script lang="ts">
	import { onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor';

	export let name: string;
	export let value: string;
	let el: HTMLDivElement;
	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;

	$: editor?.setValue(value || '');
	$: if (editor && monaco)
		monaco.editor.setModelLanguage(editor.getModel()!, getLanguage(name, value));

	const suffixRules: Array<[string, RegExp]> = [
		['javascript', /^jsx?$/],
		['typescript', /^tsx?$/],
		['css', /^css$/],
		['html', /^html$/],
		['markdown', /^md$/]
	];

	const contentRules: Array<[string, RegExp]> = [['html', /^\s*<[!\w]/]];

	function getLanguage(name: string, content: string) {
		const suffix = name.match(/.\.(\w+)$/)?.[1]?.toLowerCase();
		if (suffix) return suffixRules.find(([key, value]) => value.test(suffix))?.[0] ?? '';
		return contentRules.find(([key, value]) => value.test(content))?.[0] ?? '';
	}

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
			automaticLayout: true
		});
	});
</script>

<div class="w-full h-full" bind:this={el} />
