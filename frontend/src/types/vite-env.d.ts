/// <reference types="vite/client" />

// ===========================================
// VITE ENVIRONMENT TYPES
// ===========================================
/**
 * Interface globale représentant les métadonnées d'import Vite.
 * Accessible partout via `import.meta`.
 */
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
