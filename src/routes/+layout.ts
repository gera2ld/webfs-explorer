import { injectGlobal, install } from '@twind/core';
import presetAutoprefix from '@twind/preset-autoprefix';
import presetTailwind from '@twind/preset-tailwind';
import { browser } from '$app/environment';

export const prerender = true;

if (browser) {
	install({
		presets: [presetAutoprefix(), presetTailwind()],
		hash: false,
	});
	injectGlobal`
		body {
			@apply bg(white dark:zinc-800) text-zinc(800 dark:300);
		}
		a, button {
			@apply text-blue(400 hover:500 dark:500 dark:hover:400);
		}
		button {
			@apply bg-transparent;
		}
		select {
			@apply bg-transparent border-b border-zinc-300;
		}
		input {
			@apply bg-transparent border-b border-zinc-300 text-inherit;
		}
		.iconify {
			@apply inline-block;
		}
	`;
}
