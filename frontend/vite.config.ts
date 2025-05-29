import { defineConfig } from 'vite'
import { __dirname, resolve } from 'path';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build'
  
  return {
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: true
    },
    css: {
      postcss: './postcss.config.js'
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      base: isProduction ? './' : '/',
      // minify: isProduction ? 'esbuild' : false,
      minify: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/js/[name].js',
          chunkFileNames: 'assets/js/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.type === 'asset' && assetInfo.name?.endsWith('.css')) {
             return 'assets/css/[name][extname]'
            }
            return 'assets/[name][extname]'
          }
        }
      }
    }
  }
})