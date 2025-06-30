/// <reference types="vite/client" />

// ===========================================
// VITE ENVIRONMENT
// ===========================================
/**
 * Interface permettant d'accéder aux variables d'environnement Vite.
 *
 * Ces métadonnées sont disponibles via `import.meta.env` dans tout le projet.
 * Utilisé pour typage strict des variables comme `VITE_API_URL`, etc.
 * 
 * Possibilité d'ajouter des variables comme:
 * VITE_API_URL, VITE_GOOGLE_CLIENT_ID, etc.
 */
/**
 * Interface utilisée pour typer strictement les variables d'environnement Vite.
 *
 * Possibilité d'ajouter des variables comme:
 * VITE_API_URL, VITE_GOOGLE_CLIENT_ID, etc.
 */
interface ImportMetaEnv {}

/**
 * Interface globale représentant les métadonnées d'import Vite.
 * Accessible partout via `import.meta`.
 */
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
