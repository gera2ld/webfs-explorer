import isUtf8 from 'isutf8';
import type { FileData } from '../types';

const rules: Array<[lang: string, suffixRule: RegExp, contentRule?: RegExp]> = [
	['javascript', /^[mc]?jsx?$/],
	['typescript', /^tsx?$/],
	['css', /^css$/],
	['html', /^html$/, /^\s*<[!\w]/],
	['markdown', /^md$/],
	['go', /^go$/],
	['json', /^json$/],
];

function detectTextFile(name: string, content: string) {
	const result: FileData = {
		type: 'text',
		content,
	};
	const suffix = name.match(/.\.(\w+)$/)?.[1]?.toLowerCase();
	result.language = rules.find(
		([, suffixRule, contentRule]) =>
			(suffix && suffixRule.test(suffix)) || contentRule?.test(content)
	)?.[0];
	return result;
}

function detectBinaryFile(name: string, content: Uint8Array) {
	const result: FileData = {
		type: 'unknown',
		content,
	};
	const magicNumber = content.slice(0, 4).reduce((prev, c) => prev * 256 + c, 0);
	switch (magicNumber) {
		// PNG
		case 0x89504e47:
		// GIF
		case 0x47494638:
		// JPG
		case 0xffd8ffe0:
		case 0xffd8ffe1:
		case 0xffd8ffe2:
		case 0xffd8ffe3:
		case 0xffd8ffe8:
			result.type = 'image';
			break;
	}
	return result;
}

export function detectFile(name: string, content: Uint8Array) {
	if (isUtf8(content)) {
		const decoder = new TextDecoder();
		return detectTextFile(name, decoder.decode(content));
	}
	return detectBinaryFile(name, content);
}
