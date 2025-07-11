import { UploadResult, UploadValidationResult } from '../../types/return.types';
import { DB_CONST, IMAGE_CONST } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { showAlert } from '../../utils/dom.utils';
import { User } from 'src/models/user.model';

// ===========================================
// IMAGE SERVICE
// ===========================================
/**
 * Classe statique du service de gestion des images.
 * 
 * Ce service est responsable de:
 * - valider les fichiers image
 * - convertir les fichiers en URL de prévisualisation
 * - uploader et supprimer des avatars
 * - récupérer l'URL de l'avatar actuel
 */

// TODO: Faire requête API dans dossier api pour update image

export class ImageService {
	private static readonly UPLOAD_ENDPOINT = '/upload-avatar';

	/**
	 * Valide un fichier image.
	 *
	 * Si le fichier est null et qu'il provient d'un formulaire d'inscription,
	 * on considère que c'est valide car l'utilisateur n'est pas obligé de fournir
	 * un avatar.
	 *
	 * Si le fichier existe, on vérifie sa taille et son type.
	 *
	 * @param {File | null} avatarFile Le fichier image à valider.
	 * @param {boolean} fromRegisterForm Si le fichier provient d'un formulaire
	 * d'inscription.
	 * @returns {boolean} Si le fichier est valide.
	 */
	public static isValidImage(avatarFile: File | null, fromRegisterForm: boolean = false): boolean {
		if (fromRegisterForm && (!avatarFile || avatarFile!.size === 0)) {
			return true;
		}
		if (!fromRegisterForm && (!avatarFile || avatarFile!.size === 0)) {
			showAlert('The selected image is empty.');
			return false;
		}
		if (avatarFile!.size > IMAGE_CONST.MAX_SIZE) {
			showAlert(IMAGE_CONST.MAX_SIZE);
			return false;
		}
		if (!(avatarFile!.type in IMAGE_CONST.EXTENSIONS)) {
			showAlert(IMAGE_CONST.TYPE_ERROR);
			return false;
		}
		return true;
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
			const isValidImage = this.isValidImage(file);
			if (!isValidImage) {
				return {
					success: false
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
	 * Vérifie si l'image existe sur le serveur.
	 * 
	 * La méthode HEAD est utilisée pour éviter de charger l'image.
	 * 
	 * @param {string} url L'URL de l'image à vérifier.
	 * @returns {Promise<boolean>} Une promesse qui se résout avec `true` si l'image existe, `false` sinon.
	 */
	public static async checkImageExists(url: string): Promise<boolean> {
		try {
			const res = await fetch(url, { method: 'HEAD' });
			return res.ok;
		} catch {
			return false;
		}
	}
	
	/**
	 * Récupère l'URL complète de l'avatar d'un utilisateur.
	 *
	 * Si l'utilisateur n'a pas d'avatar défini, ou que le fichier n'existe pas
	 * sur le serveur, retourne l'URL de l'avatar par défaut.
	 *
	 * @param {User} user - L'utilisateur pour lequel récupérer l'avatar.
	 * @returns {Promise<string>} L'URL complète de l'avatar de l'utilisateur.
	 */
	public static async getUserAvatarURL(user: User): Promise<string> {
		const defaultUrl = `${IMAGE_CONST.ROUTE_API}${DB_CONST.USER.DEFAULT_AVATAR}`;
		if (!user.avatar) {
			return defaultUrl;
		}
		if (user.registerFrom === DB_CONST.USER.REGISTER_FROM.GOOGLE) {
			return user.avatar;
		}
		const avatarUrl = `${IMAGE_CONST.ROUTE_API}${user.avatar}`;
		const exists = await this.checkImageExists(avatarUrl);
		return exists ? avatarUrl : defaultUrl;
	}
}