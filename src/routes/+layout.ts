import { injectGlobal, install } from '@twind/core';
import presetAutoprefix from '@twind/preset-autoprefix';
import presetTailwind from '@twind/preset-tailwind';
import { browser } from '$app/environment';

export const prerender = true;

if (browser) {
	install({
		presets: [presetAutoprefix(), presetTailwind()],
	});
	injectGlobal`
		body {
			@apply bg(white dark:zinc-800) text-zinc(800 dark:300);
		}
		a {
			@apply text-blue(400 hover:600);
		}
		button {
			@apply bg-transparent text-blue(400 hover:600);
		}
		select {
			@apply bg-transparent border-b border-zinc-300;
		}
		input {
			@apply bg-transparent border-b border-zinc-300 text-inherit text-xs;
		}
		.iconify {
			@apply inline-block;
		}
	`;
}
