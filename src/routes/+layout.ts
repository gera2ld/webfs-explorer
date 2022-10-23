import { setup, apply } from 'twind/shim';
import * as colors from 'twind/colors';
import { browser } from "$app/environment";

export const prerender = true;

if (browser) {
	setup({
		theme: {
			extend: {
				colors,
			},
		},
		preflight: (preflight) => ({
			...preflight,
			body: apply`bg(white dark:gray-800) text-gray(800 dark:300)`,
			a: apply`text-blue(400 hover:600)`,
			button: apply`bg-transparent text-blue(400 hover:600)`,
			'.iconify': apply`inline-block`,
		}),
	});
}
