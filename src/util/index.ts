export * from './ipfs';
export * from './file-type';

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
