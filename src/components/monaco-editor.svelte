<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type * as Monaco from 'monaco-editor';

	const dispatch = createEventDispatcher();

	export let language = '';
	export let value = '';
	export let readOnly = false;
	export let dirty = false;

	let className = '';
	export { className as class };

	export function getContent() {
		return model?.getValue();
	}

	let el: HTMLDivElement;
	let editor: Monaco.editor.IStandaloneCodeEditor;
	let model: Monaco.editor.ITextModel;
	let monaco: typeof Monaco;

	$: editor?.updateOptions({ readOnly });
	$: if (editor && !dirty) initialize(value, language);

	function updateTheme(dark: boolean) {
		monaco.editor.setTheme(dark ? 'vs-dark' : 'vs');
	}

	async function initialize(value: string, language: string) {
		model?.dispose();
		model = monaco.editor.createModel(value, language);
		model.onDidChangeContent(() => {
			dispatch('change');
		});
		editor.setModel(model);
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
			wordWrap: 'on',
		});
	});
</script>

<div class={`w-full h-full ${className}`} bind:this={el} />
