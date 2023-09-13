import { defineConfig } from 'unocss';
import presetUno from '@unocss/preset-uno';

export default defineConfig({
	content: {
		filesystem: ['src/**/*.{ts,tsx,html,svelte}'],
	},
	presets: [presetUno()],
});
