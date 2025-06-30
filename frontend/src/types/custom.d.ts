/**
 * Module qui permet d'importer un fichier HTML en tant que string brute dans
 * un fichier TypeScript.
 * 
 * En mode dev, Vite a besoin de cette déclaration pour que l'import fonctionne et que les
 * fichiers HTML soient hot-reloadés s'ils ne sont pas dans le dossier public.
 * Nous en avons besoin pour les fichiers HTML des composants présents dans le dossier src.
 * 
 * La déclaration est nécessaire pour que TypeScript ne mette pas d'erreur.
 * 
 * @example
 * import template from './template.html?raw';
 */
declare module '*.html?raw' {
	const content: string;
	export default content;
}
