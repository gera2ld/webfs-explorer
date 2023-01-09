<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import NodeTree from '../components/node-tree.svelte';
	import MonacoEditor from '../components/monaco-editor.svelte';
	import ImageViewer from '../components/image-viewer.svelte';
	import ProviderOption from '../components/provider-option.svelte';
	import type { FSNode, FileData, ISupportedUrl } from '../types';
	import type { IFileProvider } from '../providers';
	import { createProvider } from '../providers';
	import { detectFile, parseUrl, reprUrl, relpath } from '../util';

	const QS_ROOT = 'r';
	const QS_PATH = 'p';

	let provider: IFileProvider;
	let rootUrl: ISupportedUrl;
	let root: FSNode;
	let active: FSNode;
	let action = '';
	let inputPath = '';
	let loading = true;
	let activeContent: FileData;
	let message: string;
	let getContent: () => string;
	let options: Record<string, string> = {};

	$: if (active) updateActiveContent();

	async function loadChildren(node: FSNode, force = false) {
		if (!node.children || force) {
			node.children = await provider.readDir(node.path);
			node.children.forEach((child) => {
				child.parent = node;
			});
			return true;
		}
	}

	async function updateActiveContent() {
		if (active.type === 'directory') {
			activeContent = { type: 'directory', content: null };
			if (await loadChildren(active)) active = active;
		} else {
			const content = await provider.readFile(active.path);
			activeContent = detectFile(active.name, content);
		}
	}

	async function openPath(
		filePath = 'ipfs:/',
		activePath = active ? relpath(active.path, root.path) : ''
	) {
		loading = true;
		try {
			const url = parseUrl(filePath);
			provider = await createProvider(url);
			root = await provider.stat('');
			rootUrl = provider.data;
			options = provider.options.reduce((prev, item) => {
				prev[item.name] = item.value;
				return prev;
			}, {} as Record<string, string>);
			await setActive(activePath);
		} catch (error) {
			showMessage(`${error}`);
			console.error(error);
		} finally {
			loading = false;
		}
	}

	async function handleUpdate() {
		const data = provider.setOptions(options);
		if (data) {
			const url = reprUrl(data);
			inputPath = url;
			await openPath(url);
		}
	}

	async function main() {
		const params = new URLSearchParams(window.location.hash.slice(1));
		let cwd = params.get(QS_ROOT) ?? 'npm:@gera2ld/tarjs';
		let active = params.get(QS_PATH) ?? '';
		inputPath = cwd;
		await openPath(cwd, active);
	}

	async function updateNode(node: FSNode) {
		if (!provider.readOnly) Object.assign(node, await provider.stat(node.path));
		return node;
	}

	async function setActive(pathFromRoot = '') {
		if (active?.dirty) return;
		let node = root;
		const parts = pathFromRoot.split('/').filter(Boolean);
		for (const part of parts) {
			if (node.type === 'directory') await loadChildren(node);
			node.expand = true;
			const child = node.children?.find((child) => child.name === part);
			if (!child) {
				console.error(`Could not find path: ${pathFromRoot}`);
				break;
			}
			node = child;
		}
		if (node.type === 'directory') node.expand = active === node ? !node.expand : true;
		active = await updateNode(node);
		root = root;
		const params = new URLSearchParams(window.location.hash.slice(1));
		params.set(QS_ROOT, reprUrl(rootUrl));
		params.set(QS_PATH, pathFromRoot);
		window.location.hash = params.toString();
	}

	function handleOpen() {
		openPath(inputPath, '');
	}

	function handleDownload() {
		if (!(activeContent?.content instanceof Uint8Array)) return;
		const blob = new Blob([activeContent.content]);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		if (active?.name) a.download = active.name;
		a.click();
		setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 2000);
	}

	function truncateText(text: string, maxPrefix = 30, maxSuffix = 0) {
		if (text.length <= maxPrefix + maxSuffix + 3) return text;
		return text.slice(0, maxPrefix) + '...' + text.slice(-maxSuffix);
	}

	function handleCopy(e: MouseEvent) {
		const el = (e.target as HTMLElement).closest('[data-text]') as HTMLElement;
		const text = el?.dataset.text;
		if (text) {
			navigator.clipboard.writeText(text);
			showMessage(`Copied ${truncateText(text, 30, 4)}`);
		}
	}

	let timer: NodeJS.Timeout;
	function showMessage(text: string) {
		console.info(text);
		message = text;
		clearTimeout(timer);
		timer = setTimeout(() => {
			message = '';
		}, 2000);
	}

	async function handleDelete() {
		if (!active || active === root) return;
		if (!confirm(`Confirm to delete ${active.path}?`)) return;
		await provider.delete(active.path);
		if (active.parent) {
			await loadChildren(active.parent, true);
			active = active.parent;
		}
	}

	async function handleRevert() {
		if (activeContent?.type !== 'text') return;
		active.dirty = false;
	}

	async function handleSave() {
		if (activeContent?.type !== 'text') return;
		await provider.writeFile(active.path, getContent());
		active = await updateNode(active);
		active.dirty = false;
	}

	function createAction(name: string, expand = false) {
		return () => {
			action = name;
			if (expand) active.expand = true;
		};
	}

	function handleSetActive(e: CustomEvent<FSNode>) {
		setActive(relpath(e.detail.path, root.path));
	}

	async function handleRename(e: CustomEvent<string>) {
		action = '';
		const newName = e.detail;
		const newPath = active.path.replace(/\/[^/]+$/, `/${newName}`);
		await provider.rename(active.path, newPath);
		if (active.parent) {
			await loadChildren(active.parent, true);
			await setActive(relpath(newPath, root.path));
		}
	}

	async function handleNewDir(e: CustomEvent<string>) {
		action = '';
		let newPath = active.path;
		if (!newPath.endsWith('/')) newPath += '/';
		newPath += e.detail;
		await provider.mkdir(newPath);
		await loadChildren(active, true);
		await setActive(relpath(newPath, root.path));
	}

	async function handleNewFile(e: CustomEvent<string>) {
		action = '';
		let newPath = active.path;
		if (!newPath.endsWith('/')) newPath += '/';
		newPath += e.detail;
		if (await provider.exists(newPath)) throw new Error(`File exists: ${newPath}`);
		try {
			await provider.writeFile(newPath, '');
		} catch {
			// the file is created even an error is returned
		}
		await loadChildren(active, true);
		await setActive(relpath(newPath, root.path));
	}

	onMount(main);
</script>

<div class="w-screen h-screen flex flex-col">
	<header class="flex border-b border-gray-400 px-4 py-2">
		<form on:submit|preventDefault={handleOpen}>
			<Icon icon="tabler:prompt" />
			<input
				class="bg-transparent w-[400px] border-b border-gray-300 text-xs"
				placeholder="IPFS path"
				bind:value={inputPath}
			/>
			<button type="submit" title="Go"><Icon icon="bx:rocket" /></button>
		</form>
		{#if provider?.options.length}
			<form on:submit|preventDefault={handleUpdate}>
				{#each provider.options as option}
					<ProviderOption props={option} bind:value={options[option.name]} />
				{/each}
				<button type="submit" title="Update"><Icon icon="mi:enter" /></button>
			</form>
		{/if}
		<div class="flex-1" />
		{#if activeContent && active.cid}
			<button class="ml-2" data-text={active.cid} on:click|preventDefault={handleCopy}>CID</button>
			<button
				class="ml-2"
				data-text={`https://dweb.link/ipfs/${active.cid}`}
				on:click|preventDefault={handleCopy}
			>
				URL
			</button>
		{/if}
	</header>
	<div class="flex flex-1 min-h-0">
		<div class="flex flex-col w-[320px] border-r border-gray-400 px-4 overflow-auto">
			{#if provider && !provider.readOnly}
				<div class="text-right">
					<button class="ml-2" on:click={createAction('newDir', true)}>
						<Icon icon="ant-design:folder-add-outlined" />
					</button>
					<button class="ml-2" on:click={createAction('newFile', true)}>
						<Icon icon="ant-design:file-add-outlined" />
					</button>
					<button class="ml-2" on:click={createAction('rename')}>
						<Icon icon="fluent-mdl2:rename" />
					</button>
					<button class="ml-2" on:click={handleDelete}>
						<Icon icon="bx:trash" />
					</button>
				</div>
			{/if}
			<div class="flex-1 pb-4">
				{#if loading}
					<div class="text-gray-400">Loading...</div>
				{:else}
					<NodeTree
						{root}
						bind:active
						bind:action
						on:setActive={handleSetActive}
						on:cancel={createAction('')}
						on:rename={handleRename}
						on:newDir={handleNewDir}
						on:newFile={handleNewFile}
					/>
				{/if}
			</div>
		</div>
		<div class="flex-1 min-w-0 flex flex-col">
			{#if loading || (active && !activeContent)}
				<div class="h-full flex items-center justify-center text-gray-400">Loading...</div>
			{:else if !activeContent || activeContent.type === 'directory'}
				<div class="h-full flex items-center justify-center text-gray-400">
					Pick a file to view / edit its content
				</div>
			{:else if activeContent.type === 'text'}
				{#if !provider.readOnly}
					<div class="px-4">
						<button class="mr-2" on:click={handleRevert}><Icon icon="ci:undo" /></button>
						<button class="mr-2" on:click={handleSave}><Icon icon="ic:sharp-save-alt" /></button>
					</div>
				{/if}
				<MonacoEditor
					class="flex-1"
					language={activeContent.language}
					value={activeContent.content}
					dirty={active.dirty}
					readOnly={provider.readOnly}
					bind:getContent
					on:change={() => {
						active.dirty = true;
					}}
				/>
			{:else if activeContent.type === 'image'}
				<ImageViewer class="flex-1" name={active?.name} content={activeContent.content} />
			{:else}
				<div class="p-4">
					<div>{active?.name}</div>
					<div>
						Unsupported file,
						<button on:click|preventDefault={handleDownload}>click to download</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
{#if message}
	<div class="absolute top-0 right-0 px-2 py-1 bg-gray-500 text-orange-400">{message}</div>
{/if}
