/**
 * Résultat de l'upload d'un avatar.
 * 
 * success indique si l'upload a réussi.
 * avatarUrl contient l'URL de l'image uploadée si l'upload a réussi.
 * errorMessage contient le message d'erreur si l'upload a échoué.
 */
export interface UploadResult {
	success: boolean;
	avatarUrl?: string;
	errorMessage?: string;
}

/**
 * Résultat de la validation d'un fichier image.
 * 
 * isValid indique si le fichier est valide.
 * errorMessage contient le message d'erreur si le fichier est invalide.
 */
export interface UploadValidationResult {
	isValid: boolean;
	errorMessage?: string;
}
