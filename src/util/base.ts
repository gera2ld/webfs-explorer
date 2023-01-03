const loaded: Record<string, Promise<void>> = {};

export function loadJs(url: string) {
	loaded[url] ||= new Promise<void>((resolve, reject) => {
		const s = document.createElement('script');
		s.src = url;
		s.onload = () => resolve();
		s.onerror = reject;
		document.body.append(s);
		s.remove();
	});
	return loaded[url];
}

export function relpath(filePath: string, basePath: string) {
	if (filePath === basePath || filePath.startsWith(`${basePath}/`))
	return filePath.slice(basePath.length + 1);
	return filePath;
}

export async function arrayFromAsync<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iter) {
    result.push(item);
  }
  return result;
}

export function mergeUint8Array(arrays: Uint8Array[]) {
  const length = arrays.reduce((prev, arr) => prev + arr.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const arr of arrays) {
    output.set(arr, offset);
    offset += arr.length;
  }
  return output;
}
