// ===========================================
// POSTCSS CONFIG
// ===========================================
/**
 * Configuration de PostCSS qui utilise Tailwind CSS pour injecter les
 * règles CSS générées dynamiquement en fonction de la configuration de
 * Tailwind dans tailwind.config.mjs.
 *
 * Cette configuration est utilisée par Vite pour traiter les fichiers CSS
 * lors du développement et de la compilation.
 *
 * Vite utilise PostCSS en interne pour traiter les fichiers CSS, et
 * fournit une configuration par défaut pour PostCSS.
 * Dans ce fichier, on remplace cette configuration par défaut par une
 * configuration custom qui utilise Tailwind CSS.
 *
 * La configuration de Tailwind est injectée dans PostCSS via le plugin
 * `tailwindcss`. Ce plugin lit la configuration de Tailwind dans
 * tailwind.config.mjs et injecte les règles CSS générées dynamiquement
 * dans la feuille de style en cours de traitement.
 *
 * Le plugin `autoprefixer` est également utilisé pour ajouter automatiquement
 * les préfixes ajoutés aux propriétés CSS
 * pour les rendre compatibles avec les anciennes versions des navigateurs
 * web.
 *
 * @type {import('postcss').Config}
 */
export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
}
