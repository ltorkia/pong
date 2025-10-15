import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
// import path from 'path';

// ===========================================
// VITE CONFIG
// ===========================================
/**
 * Configuration de Vite pour le projet.
 * Définit les paramètres selon la commande ('serve' ou 'build'),
 * incluant la compilation, le serveur de développement, le hot-reload, etc.
 * 
 * @param {{ command: string }} options - Options de configuration fournies par Vite.
 * @returns {import('vite').UserConfig} Configuration Vite adaptée à la commande.
 */
export default defineConfig(({ command: command }: { command: string }) => {

    const isProduction = command === 'build';						// Détermine si l'environnement est en production

    return {
        server: {
            host: '0.0.0.0',										// Hôte du serveur
            port: 3000,												// Port du serveur
            hmr: true												// Activation du rechargement à chaud
        },
        css: {
            postcss: './postcss.config.mjs'							// Fichier de configuration PostCSS
        },
        build: {
            outDir: 'dist',											// Répertoire de sortie
            sourcemap: false,										// Génération de la carte des sources
            base: isProduction ? './' : '/',						// Base URL pour les éléments de sortie
            minify: isProduction ? 'esbuild' : false,				// Minification des fichiers
            rollupOptions: {
                output: {
                    entryFileNames: 'assets/js/[name].js',			// Nom des fichiers d'entrée
                    chunkFileNames: 'assets/js/[name].js',			// Nom des fichiers de chunks
                    assetFileNames: (assetInfo: any): string => {
                        const name = assetInfo.name ?? '';
                        if (assetInfo.type === 'asset') {
                            if (name.endsWith('.css')) {
                                return 'assets/css/[name][extname]';		// Nom des fichiers CSS	
                            }
                            if (name.startsWith('fa-') && /\.(woff2?|ttf)$/.test(name)) {
                                return 'assets/fonts/fa/[name][extname]';	// Nom des fichiers de polices FontAwesome
                            }
                        }
                        return 'assets/[name][extname]';					// Nom des autres fichiers
                    }
                }
            }
        },
        plugins: [
            ...(isProduction
                // Plugin de copie statique pour la production
                ? [viteStaticCopy({
                    targets: [
                        {
                            src: 'src/components/**/*.html',
                            dest: '.',

                            /**
                             * Renomme un fichier en utilisant son chemin complet.
                             * 
                             * Cette fonction prend le nom, l'extension, et le chemin complet d'un fichier,
                             * et retourne le chemin relatif à partir du dossier 'src' pour le mettre dans 'public'
                             * à la compilation. Permet de garder la structure locale dans 'public'.
                             * 
                             * @param {string} name - Le nom du fichier.
                             * @param {string} extension - L'extension du fichier.
                             * @param {string} fullPath - Le chemin complet du fichier.
                             * @returns {string} Le chemin relatif du fichier à partir du dossier 'src'.
                             */
                            rename: (name: string, extension: string, fullPath: string): string => {
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