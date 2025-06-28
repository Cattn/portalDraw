import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			out: 'build',
			precompress: true,
			envPrefix: ''
		}),
		typescript: {
			config: (config) => {
				config.compilerOptions = {
					...config.compilerOptions,
					moduleResolution: 'bundler',
					allowImportingTsExtensions: false,
					verbatimModuleSyntax: false
				};
				return config;
			}
		}
	}
};

export default config;
