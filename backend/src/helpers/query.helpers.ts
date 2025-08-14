/**
 * Sanitize un terme de recherche.
 *
 * Si le terme n'est pas une chaîne de caractères, alors la fonction renvoie une chaîne vide.
 *
 * Si le terme est une chaîne de caractères, alors la fonction renvoie le terme nettoyé :
 * - les espaces en début et en fin de chaîne sont supprimés avec `trim()`,
 * - la longueur du terme est limitée à 100 caractères avec `slice(0, 100)`,
 * - cela permet de limiter les risques de SQL injection en limitant la longueur des query.
 *
 * @param term - Le terme de recherche à sanitizer.
 * @returns Le terme de recherche nettoyé.
 */
export function sanitizeSearchTerm(term: unknown): string {
	if (typeof term !== 'string') {
		return '';
	}
	return term.trim().slice(0, 100);
}