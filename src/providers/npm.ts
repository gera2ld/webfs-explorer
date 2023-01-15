import { TarFileType } from '@gera2ld/tarjs';
import type { ITarFileInfo } from '@gera2ld/tarjs';
import type { FSNode, IProviderInputOption, IProviderSelectOption, ISupportedUrl } from '../types';
import { IFileProvider } from './base';

interface TarFileItem extends ITarFileInfo {
	content: Blob;
}

interface IRegistryMeta {
	name: string;
	'dist-tags': Record<string, string>;
	versions: Record<
		string,
		{
			dist: {
				tarball: string;
			};
		}
	>;
}

const DEFAULT_REGISTRY = 'registry.npmjs.org';
const DEFAULT_REGISTRIES = [DEFAULT_REGISTRY, 'registry.yarnpkg.com', 'npm.pkg.github.com'];

export class NPMProvider extends IFileProvider {
	readOnly = true;

	constructor(
		data: ISupportedUrl,
		private fileMap: Map<string, TarFileItem>,
		private dirMap: Map<string, Set<string>>,
		private versionName: string,
		private meta: IRegistryMeta
	) {
		super(data);
		this.options = [this.getVersionInfo(), this.getRegistryInfo()];
	}

	private getVersionInfo(): IProviderSelectOption {
		const distTags = Object.entries(this.meta['dist-tags']).map(([tag, version]) => ({
			title: `${tag} (${version})`,
			value: tag,
		}));
		const versions = Object.keys(this.meta.versions)
			.map((version) => ({ title: version, value: version }))
			.reverse();
		return {
			type: 'select',
			name: 'version',
			label: 'Versions:',
			value: this.versionName,
			data: [...distTags, ...versions],
		};
	}

	private getRegistryInfo(): IProviderInputOption {
		return {
			type: 'input',
			name: 'registry',
			label: 'Registry:',
			value: this.data.query?.registry || DEFAULT_REGISTRY,
			data: DEFAULT_REGISTRIES,
		};
	}

	setOptions(options: Record<string, string>) {
		let { version, registry } = options;
		if (version === 'latest') version = '';
		if (registry.startsWith('https://')) registry = registry.slice(7);
		if (registry === DEFAULT_REGISTRY) registry = '';
		const query: Record<string, string> = {
			...this.data.query,
			registry,
		};
		Object.entries(query).forEach(([key, value]) => {
			if (value == null) delete query[key];
		});
		const data: ISupportedUrl = {
			...this.data,
			query,
			pathname: [this.meta.name, version && version !== 'latest' ? version : '']
				.filter(Boolean)
				.join('@'),
		};
		return data;
	}

	async stat(filePath: string) {
		return this.internalStat(filePath);
	}

	async exists(filePath: string) {
		try {
			this.internalStat(filePath);
			return true;
		} catch {
			return false;
		}
	}

	private internalStat(filePath: string): FSNode {
		if (this.dirMap.has(filePath)) {
			return {
				name: filePath.split('/').pop() || '',
				type: 'directory',
				size: 0,
				path: filePath,
			};
		}
		const file = this.fileMap.get(filePath);
		if (!file) throw new Error('File not exists');
		return {
			name: filePath.split('/').pop() || '',
			type: file.type === TarFileType.Dir ? 'directory' : 'file',
			size: file.size,
			path: filePath,
		};
	}

	async readFile(filePath: string) {
		const file = this.fileMap.get(filePath);
		if (!file) throw new Error('File not exists');
		const buffer = await file.content.arrayBuffer();
		return new Uint8Array(buffer);
	}

	async readDir(filePath: string) {
		return Array.from(this.dirMap.get(filePath) || [], (name) => this.internalStat(name)).sort(
			(a, b) => {
				const keyA = a.type[0] + a.name;
				const keyB = b.type[0] + b.name;
				return keyA < keyB ? -1 : 1;
			}
		);
	}
}

export async function create(data: ISupportedUrl) {
	let registry = data.query?.registry || DEFAULT_REGISTRY;
	if (!registry.includes('://')) registry = `https://${registry}`;
	let pkgName = data.pathname;
	let versionName = 'latest';
	const i = pkgName.indexOf('@', 1);
	if (i > 0) {
		versionName = pkgName.slice(i + 1);
		pkgName = pkgName.slice(0, i);
	}
	const metaUrl = `${registry}/${pkgName}`;
	const meta = await loadJson<IRegistryMeta>(metaUrl);
	return createWithVersion(data, meta, versionName);
}

async function createWithVersion(data: ISupportedUrl, meta: IRegistryMeta, versionName: string) {
	const distTags = meta['dist-tags'];
	const versionInfo = meta.versions[distTags[versionName] || versionName];
	const tarUrl = versionInfo.dist.tarball;
	const { fileMap, dirMap } = await loadTarballByUrl(tarUrl);
	return new NPMProvider(data, fileMap, dirMap, versionName, meta);
}

async function loadTarball(buffer: ArrayBuffer) {
	const [pako, { TarReader }] = await Promise.all([import('pako'), import('@gera2ld/tarjs')]);
	const tar = pako.inflate(buffer);
	const reader = new TarReader();
	const items = await reader.readFile(tar);
	const files = items.map((item) => ({
		...item,
		name: item.name.replace(/^package\//, ''),
		content: reader.getFileBlob(item.name),
	}));
	const fileMap = new Map(files.map((file) => [file.name, file]));
	const dirMap = new Map<string, Set<string>>();
	let leaves = [...fileMap.keys()];
	while (leaves.length) {
		const newLeaves: string[] = [];
		leaves.forEach((name) => {
			const parent = name.split('/').slice(0, -1).join('/');
			if (parent) newLeaves.push(parent);
			let children = dirMap.get(parent);
			if (!children) {
				children = new Set();
				dirMap.set(parent, children);
			}
			children.add(name);
		});
		leaves = newLeaves;
	}
	return { fileMap, dirMap };
}

async function loadTarballByUrl(url: string) {
	const res = await fetch(url);
	const buffer = await res.arrayBuffer();
	return await loadTarball(buffer);
}

async function loadJson<T = unknown>(url: string) {
	const resp = await fetch(url);
	const data = (await resp.json()) as T;
	if (!resp.ok) throw { resp, data };
	return data;
}
