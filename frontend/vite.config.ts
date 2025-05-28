import { defineConfig } from 'vite'

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
      minify: isProduction ? 'esbuild' : false
    }
  }
})