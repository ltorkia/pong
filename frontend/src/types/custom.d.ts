// Pour l'import des templates components HTML dans fichiers ts
// pour que Vite les reconnaissent pour le hot reload et que TypeScript
// ne mette pas d'erreur
declare module '*.html?raw' {
	const content: string;
	export default content;
}
