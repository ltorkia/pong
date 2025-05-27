import { defineConfig } from 'vite'

export default defineConfig({
	server: {
		host: '0.0.0.0', // écoute sur toutes les interfaces réseau
		port: 3000, // port local pour accéder au frontend (redirigé ensuite par NGINX vers 8080)
		hmr: true // pour recharger automatiquement les fichiers modifiés
	},
	css: {
		postcss: './postcss.config.js'
	},
	build: {
		outDir: 'dist', // dossier de sortie pour les fichiers générés en production
		sourcemap: true // génère une source map pour faciliter le debug du code compilé
	}
})