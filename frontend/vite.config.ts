import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ command }: { command: string }) => {
	const isProduction = command === 'build'

	return {
		server: {
			host: '0.0.0.0',
			port: 3000,
			hmr: true
		},
		css: {
			postcss: './postcss.config.mjs'
		},
		build: {
			outDir: 'dist',
			sourcemap: true,
			base: isProduction ? './' : '/',
			minify: isProduction ? 'esbuild' : false,
			// minify: false,
			rollupOptions: {
				output: {
					entryFileNames: 'assets/js/[name].js',
					chunkFileNames: 'assets/js/[name].js',
					assetFileNames: (assetInfo: any) => {
						if (assetInfo.type === 'asset' && assetInfo.name?.endsWith('.css')) {
							return 'assets/css/[name][extname]'
						}
						return 'assets/[name][extname]'
					}
				}
			}
		},
		plugins: [
		...(isProduction
			? [viteStaticCopy({
				targets: [
					{
						src: 'src/components/**/*.html',
						dest: '.',
						rename: (name, extension, fullPath) => {
							const relativePath = fullPath.replace(/^.*src\//, '');
							return relativePath;
						}
					}
				]
			})]
			: [])
		]
	}
})