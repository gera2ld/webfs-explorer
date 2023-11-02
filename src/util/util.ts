export function keepLast<T extends unknown[], U>(
	fn: (isValid: () => boolean) => (...args: T) => Promise<U>,
) {
	let id = 0;
	return (...args: T) => {
		id += 1;
		const cur = id;
		const isValid = () => cur === id;
		return fn(isValid)(...args);
	};
}

export function truncateText(text: string, maxPrefix = 30, maxSuffix = 0) {
	if (text.length <= maxPrefix + maxSuffix + 3) return text;
	return text.slice(0, maxPrefix) + '...' + text.slice(-maxSuffix);
}
