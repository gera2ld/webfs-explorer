import { derived, writable } from 'svelte/store';
import { getProvider, type IFileProvider } from '../providers';
import type { FSNode, FileData, ISupportedUrl } from '../types';
import { relpath } from './base';
import { detectFile } from './file-type';
import { parseUrl, reprUrl } from './url';
import { keepLast } from './util';

export const loading = writable(false);
export const rootUrl = writable<string>();
export const activePath = writable('');
export const rootNode = writable<FSNode | undefined>();
export const activeNode = writable<FSNode | undefined>();
export const activeContent = writable<FileData | undefined>();
export const message = writable<{ type: 'info' | 'error'; content: string } | undefined>();

const parsedUrl = derived(rootUrl, ($rootUrl) => {
	try {
		return parseUrl($rootUrl);
	} catch {
		// ignore
	}
});
export const provider = derived(
	parsedUrl,
	($parsedUrl) => $parsedUrl && getProvider($parsedUrl.provider),
);

derived(
	[provider, parsedUrl],
	keepLast((isValid) => async ([$provider, $parsedUrl]) => {
		if (!$provider || !$parsedUrl) return;
		$provider.setData($parsedUrl);
		rootNode.set(undefined);
		loading.set(true);
		try {
			const node = await $provider.stat('');
			if (isValid()) rootNode.set(node);
		} catch (error) {
			console.error(error);
		} finally {
			loading.set(false);
		}
	}),
).subscribe(() => {});

derived(
	[provider, rootNode, activePath],
	keepLast((isValid) => async ([$provider, $rootNode, $activePath]) => {
		activeNode.set(undefined);
		if (!$provider || !$rootNode) return;
		let node = $rootNode;
		const parts = $activePath.split('/').filter(Boolean);
		for (const part of parts) {
			if (node.type === 'directory') await loadChildren($provider, node);
			node.expand = true;
			const child = node.children?.find((child) => child.name === part);
			if (!child) {
				console.error(`Could not find path: ${$activePath}`);
				break;
			}
			node = child;
		}
		node = await updateNode($provider, node);
		if (isValid()) activeNode.set(node);
	}),
).subscribe(() => {});

derived(
	[provider, activeNode],
	keepLast((isValid) => async ([$provider, $activeNode]) => {
		activeContent.set(undefined);
		if (!$provider || !$activeNode) return;
		let fileData: FileData;
		if ($activeNode.type === 'directory') {
			fileData = { type: 'directory', content: null };
			loadChildren($provider, $activeNode).then((justLoaded) => {
				if (isValid() && justLoaded) {
					$activeNode.expand = true;
					activeNode.set($activeNode);
				}
			});
		} else {
			const content = await $provider.readFile($activeNode.path);
			fileData = detectFile($activeNode.name, content);
		}
		if (isValid()) activeContent.set(fileData);
	}),
).subscribe(() => {});

async function loadChildren($provider: IFileProvider, node: FSNode, force = false) {
	if (!node.children || force) {
		node.children = await $provider.readDir(node.path);
		node.children.forEach((child) => {
			child.parent = node;
		});
		return true;
	}
}

async function updateNode($provider: IFileProvider, node: FSNode) {
	if ($provider && !$provider.readOnly) Object.assign(node, await $provider.stat(node.path));
	return node;
}

let timer: number;
export function showMessage(content: string, type: 'info' | 'error' = 'info', time = 2000) {
	message.set({ type, content });
	clearTimeout(timer);
	timer = window.setTimeout(() => {
		message.set(undefined);
	}, time);
}

const QS_ROOT = 'r';
const QS_PATH = 'p';

export function onHashChange() {
	const params = new URLSearchParams(window.location.hash.slice(1));
	const url = params.get(QS_ROOT) || 'npm:@gera2ld/tarjs';
	const path = params.get(QS_PATH) || '';
	const normalizedUrl = reprUrl(parseUrl(url));
	rootUrl.set(normalizedUrl);
	activePath.set(path);
}

export function openPath(url: string | ISupportedUrl, path: string) {
	const params = new URLSearchParams();
	params.set(QS_ROOT, typeof url === 'string' ? url : reprUrl(url));
	params.set(QS_PATH, path);
	window.location.hash = params.toString();
}

export const actions = derived(
	[provider, rootUrl, rootNode, activePath, activeNode, activeContent],
	([$provider, $rootUrl, $rootNode, $activePath, $activeNode, $activeContent]) => {
		async function handleDelete() {
			if (!$provider || !$activeNode || $activeNode === $rootNode) return;
			if (!confirm(`Confirm to delete ${$activeNode.path}?`)) return;
			await $provider.delete($activeNode.path);
			if ($activeNode.parent) {
				await loadChildren($provider, $activeNode.parent, true);
				openPath($rootUrl, $activeNode.parent.path);
			}
		}
		async function handleRevert() {
			if ($activeContent?.type !== 'text') return;
			if ($activeNode) $activeNode.dirty = false;
		}
		async function handleSave(content: string) {
			if (!$provider || !$activeNode || $activeContent?.type !== 'text') return;
			await $provider.writeFile($activeNode.path, content);
			const node = await updateNode($provider, $activeNode);
			node.dirty = false;
			activeNode.set(node);
		}
		async function handleRename(newName: string) {
			if (!$provider || !$rootNode || !$activeNode) return;
			const newPath = $activeNode.path.replace(/\/[^/]+$/, `/${newName}`);
			await $provider.rename($activeNode.path, newPath);
			if ($activeNode.parent) {
				await loadChildren($provider, $activeNode.parent, true);
				openPath($rootUrl, relpath(newPath, $rootNode.path));
			}
		}
		function handleDownload() {
			if (!($activeContent?.content instanceof Uint8Array)) return;
			const blob = new Blob([$activeContent.content]);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			if ($activeNode?.name) a.download = $activeNode.name;
			a.click();
			setTimeout(() => {
				URL.revokeObjectURL(url);
			}, 2000);
		}
		async function handleNewDir(name: string) {
			if (!$provider || !$activeNode || !$rootNode) return;
			let newPath = $activeNode.path;
			if (!newPath.endsWith('/')) newPath += '/';
			newPath += name;
			await $provider.mkdir(newPath);
			await loadChildren($provider, $activeNode, true);
			openPath($rootUrl, relpath(newPath, $rootNode.path));
		}
		async function handleNewFile(name: string) {
			if (!$provider || !$activeNode || !$rootNode) return;
			let newPath = $activeNode.path;
			if (!newPath.endsWith('/')) newPath += '/';
			newPath += name;
			if (await $provider.exists(newPath)) throw new Error(`File exists: ${newPath}`);
			try {
				await $provider.writeFile(newPath, '');
			} catch {
				// the file is created even an error is returned
			}
			await loadChildren($provider, $activeNode, true);
			openPath($rootUrl, relpath(newPath, $rootNode.path));
		}
		function handleUpdate(updates?: Record<string, string>) {
			const data = $provider?.update({
				...updates,
			});
			if (!data) return;
			const path = $activePath && $rootNode ? relpath($activePath, $rootNode.path) : '';
			openPath(data, path);
		}

		return {
			openPath,
			handleDelete,
			handleRevert,
			handleSave,
			handleRename,
			handleDownload,
			handleNewDir,
			handleNewFile,
			handleUpdate,
		};
	},
);
