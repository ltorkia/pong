// ===========================================
// IMAGE SERVICE
// ===========================================

// TODO: Faire requête API dans dossier api pour update image

export interface UploadResult {
	success: boolean;
	avatarUrl?: string;
	errorMessage?: string;
}

export interface ValidationResult {
	isValid: boolean;
	errorMessage?: string;
}

export class ImageService {
	// TODO: Réunir types IMAGE avec backend dans shared + check size
	private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
	private static readonly UPLOAD_ENDPOINT = '/upload-avatar';

	/**
	 * Valide un fichier image.
	 *
	 * @param {File} file Le fichier à valider.
	 * @returns {ValidationResult} Le résultat de la validation.
	 */
	public static validateImage(file: File): ValidationResult {
		if (!file) {
			return {
				isValid: false,
				errorMessage: 'No image selected'
			};
		}

		// Validation du type
		if (!this.ALLOWED_TYPES.includes(file.type)) {
			return {
				isValid: false,
				errorMessage: 'Select a valid image (JPG, PNG, GIF, WebP)'
			};
		}

		// Validation de la taille
		if (file.size > this.MAX_FILE_SIZE) {
			return {
				isValid: false,
				errorMessage: 'Image size must be less than 5MB'
			};
		}

		return { isValid: true };
	}

	/**
	 * Convertit un fichier en URL de prévisualisation.
	 *
	 * @param {File} file Le fichier image.
	 * @returns {Promise<string>} Une promesse qui se résout avec l'URL de prévisualisation.
	 */
	public static async getPreviewUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const imageUrl = e.target?.result as string;
				resolve(imageUrl);
			};
			reader.onerror = () => {
				reject(new Error('Erreur lors de la lecture du fichier'));
			};
			reader.readAsDataURL(file);
		});
	}

	/**
	 * Upload un avatar sur le serveur.
	 *
	 * @param {File} file Le fichier image à uploader.
	 * @param {string} [token] Token d'authentification optionnel.
	 * @returns {Promise<UploadResult>} Une promesse qui se résout avec le résultat de l'upload.
	 */
	public static async uploadAvatar(file: File, token?: string): Promise<UploadResult> {
		try {
			// Validation préalable
			const validation = this.validateImage(file);
			if (!validation.isValid) {
				return {
					success: false,
					errorMessage: validation.errorMessage
				};
			}

			// // Préparer FormData
			// const formData = new FormData();
			// formData.append('avatar', file);

			// // Préparer les headers
			// const headers: Record<string, string> = {};
			// if (token) {
			// 	headers['Authorization'] = `Bearer ${token}`;
			// }

			// // Effectuer l'upload
			// const response = await fetch(this.UPLOAD_ENDPOINT, {
			// 	method: 'POST',
			// 	body: formData,
			// 	headers
			// });

			// if (!response.ok) {
			// 	const errorData = await response.json().catch(() => ({}));
			// 	throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
			// }

			// const result = await response.json();
			
			// return {
			// 	success: true,
			// 	avatarUrl: result.avatarUrl || result.url,
			// 	...result
			// };

		} catch (error) {
			console.error('Erreur upload avatar:', error);
			return {
				success: false,
				errorMessage: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload'
			};
		}
	}

	/**
	 * Supprime un avatar du serveur.
	 *
	 * @param {string} avatarId L'ID de l'avatar à supprimer.
	 * @param {string} [token] Token d'authentification optionnel.
	 * @returns {Promise<UploadResult>} Une promesse qui se résout avec le résultat de la suppression.
	 */
	public static async deleteAvatar(avatarId: string, token?: string): Promise<UploadResult> {
		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};
			
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const response = await fetch(`${this.UPLOAD_ENDPOINT}/${avatarId}`, {
				method: 'DELETE',
				headers
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
			}

			const result = await response.json();
			
			return {
				success: true,
				...result
			};

		} catch (error) {
			console.error('Erreur suppression avatar:', error);
			return {
				success: false,
				errorMessage: error instanceof Error ? error.message : 'Erreur inconnue lors de la suppression'
			};
		}
	}

	/**
	 * Récupère l'URL de l'avatar actuel de l'utilisateur.
	 *
	 * @param {string} userId L'ID de l'utilisateur.
	 * @param {string} [token] Token d'authentification optionnel.
	 * @returns {Promise<string | null>} Une promesse qui se résout avec l'URL de l'avatar ou null.
	 */
	public static async getCurrentAvatarUrl(userId: string, token?: string): Promise<string | null> {
		try {
			const headers: Record<string, string> = {};
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const response = await fetch(`/api/users/${userId}/avatar`, {
				headers
			});

			if (!response.ok) {
				return null;
			}

			const result = await response.json();
			return result.avatarUrl || null;

		} catch (error) {
			console.error('Erreur récupération avatar:', error);
			return null;
		}
	}
}