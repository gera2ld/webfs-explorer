import { TarFileType } from '@gera2ld/tarjs';
import type { ITarFileInfo } from '@gera2ld/tarjs';
import type { FSNode, IProviderInputProps, IProviderSelectProps, ISupportedUrl } from '../types';
import { IFileProvider } from './base';

interface TarFileItem extends ITarFileInfo {
	content: Blob;
}

interface IPackageMeta {
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

interface IPackageData {
	metaUrl: string;
	meta: IPackageMeta;
	fileMap: Map<string, TarFileItem>;
	dirMap: Map<string, Set<string>>;
	versionName: string;
}

const DEFAULT_REGISTRY = 'registry.npmjs.org';
const DEFAULT_REGISTRIES = [DEFAULT_REGISTRY, 'registry.yarnpkg.com', 'npm.pkg.github.com'];

const EMPTY_PACKAGE_DATA: IPackageData = {
	metaUrl: '',
	meta: {
		name: '',
		'dist-tags': {},
		versions: {},
	},
	fileMap: new Map(),
	dirMap: new Map(),
	versionName: '',
};

export class NPMProvider extends IFileProvider {
	static scheme = 'npm' as const;

	readOnly = true;

	private _pkgData = EMPTY_PACKAGE_DATA;
	private _loading: Promise<IPackageData> | undefined;

	options = [this._getVersionInfo(), this._getRegistryInfo()];

	async setData(data: ISupportedUrl) {
		this.data = data;
		await this._loadData(true);
	}

	private async _loadDataOnce() {
		if (this.data) {
			let registry = this.data.query?.registry || DEFAULT_REGISTRY;
			if (!registry.includes('://')) registry = `https://${registry}`;
			const { name: pkgName, version: versionName } = parsePkgVersion(this.data.pathname);
			const metaUrl = `${registry}/${pkgName}`;
			const meta =
				this._pkgData?.metaUrl === metaUrl
					? this._pkgData.meta
					: await loadJson<IPackageMeta>(metaUrl);
			const distTags = meta['dist-tags'];
			const versionInfo = meta.versions[distTags[versionName] || versionName];
			const tarUrl = versionInfo.dist.tarball;
			const { fileMap, dirMap } = await loadTarballByUrl(tarUrl);
			this._pkgData = {
				metaUrl,
				meta,
				fileMap,
				dirMap,
				versionName,
			};
		} else {
			this._pkgData = EMPTY_PACKAGE_DATA;
		}
		return this._pkgData;
	}

	private _loadData(force = false) {
		if (!this._loading || force) {
			this._loading = this._loadDataOnce();
		}
		return this._loading;
	}

	private _getVersionInfo(): IProviderSelectProps {
		return {
			type: 'select',
			name: 'version',
			label: 'Versions:',
			data: async () => {
				const pkgData = await this._loadData();
				const distTags = Object.entries(pkgData.meta['dist-tags']).map(([tag, version]) => ({
					title: `${tag} (${version})`,
					value: tag,
				}));
				const versions = Object.keys(pkgData.meta.versions)
					.map((version) => ({ title: version, value: version }))
					.reverse();
				return {
					value: pkgData.versionName,
					options: [...distTags, ...versions],
				};
			},
		};
	}

	private _getRegistryInfo(): IProviderInputProps {
		return {
			type: 'input',
			name: 'registry',
			label: 'Registry:',
			data: async () => ({
				value: this.data?.query?.registry || DEFAULT_REGISTRY,
				options: DEFAULT_REGISTRIES,
			}),
		};
	}

	update(options: Record<string, string>) {
		let { version, registry } = options;
		const { name: pkgName, version: currentVersion } = parsePkgVersion(
			options.pathname ?? this.data?.pathname ?? ''
		);
		version ??= currentVersion;
		if (version === 'latest') version = '';
		registry ??= this.data?.query?.registry || '';
		if (registry.startsWith('https://')) registry = registry.slice(7);
		if (registry === DEFAULT_REGISTRY) registry = '';
		const query: Record<string, string> = {
			...this.data?.query,
			registry,
		};
		Object.entries(query).forEach(([key, value]) => {
			if (value == '') delete query[key];
		});
		const data: ISupportedUrl = {
			...this.data,
			provider: NPMProvider.scheme,
			query,
			pathname: [pkgName, version].filter(Boolean).join('@'),
		};
		return data;
	}

	async stat(filePath: string) {
		return this._internalStat(filePath);
	}

	async exists(filePath: string) {
		try {
			await this._internalStat(filePath);
			return true;
		} catch {
			return false;
		}
	}

	private async _internalStat(filePath: string): Promise<FSNode> {
		const { dirMap, fileMap } = await this._loadData();
		if (dirMap.has(filePath)) {
			return {
				name: filePath.split('/').pop() || '',
				type: 'directory',
				size: 0,
				path: filePath,
			};
		}
		const file = fileMap.get(filePath);
		if (!file) throw new Error('File not exists');
		return {
			name: filePath.split('/').pop() || '',
			type: file.type === TarFileType.Dir ? 'directory' : 'file',
			size: file.size,
			path: filePath,
		};
	}

	async readFile(filePath: string) {
		const { fileMap } = await this._loadData();
		const file = fileMap.get(filePath);
		if (!file) throw new Error('File not exists');
		const buffer = await file.content.arrayBuffer();
		return new Uint8Array(buffer);
	}

	async readDir(filePath: string) {
		const { dirMap } = await this._loadData();
		const files = await Promise.all(
			Array.from(dirMap.get(filePath) || [], (name) => this._internalStat(name))
		);
		files.sort((a, b) => {
			const keyA = a.type[0] + a.name;
			const keyB = b.type[0] + b.name;
			return keyA < keyB ? -1 : 1;
		});
		return files;
	}
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

function parsePkgVersion(name: string) {
	const i = name.indexOf('@', 1);
	let version = 'latest';
	if (i > 0) {
		version = name.slice(i + 1);
		name = name.slice(0, i);
	}
	return { name, version };
}
