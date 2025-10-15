import { showAlert } from './dom.utils';
import { IMAGE_CONST } from '../shared/config/constants.config';

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
export function isValidImage(avatarFile: File | null, fromRegisterForm: boolean = false): boolean {
	if (fromRegisterForm && (!avatarFile || avatarFile!.size === 0)) {
		return true;
	}
	if (!fromRegisterForm && (!avatarFile || avatarFile!.size === 0)) {
		showAlert('The selected image is empty.');
		return false;
	}
	if (avatarFile!.size > IMAGE_CONST.MAX_SIZE) {
		showAlert(IMAGE_CONST.ERRORS.SIZE_LIMIT);
		return false;
	}
	if (!(avatarFile!.type in IMAGE_CONST.EXTENSIONS)) {
		showAlert(IMAGE_CONST.ERRORS.TYPE_ERROR);
		return false;
	}
	return true;
}

/**
 * Vérifie si l'image existe sur le serveur.
 * 
 * La méthode HEAD est utilisée pour éviter de charger l'image.
 * 
 * @param {string} url L'URL de l'image à vérifier.
 * @returns {Promise<boolean>} Une promesse qui se résout avec `true` si l'image existe, `false` sinon.
 */
export async function checkImageExists(url: string): Promise<boolean> {
	// const res = await fetch(url, { method: 'HEAD' });
	// if (res.ok)
	// 	return true;
	// return false;
	try {
		const res = await fetch(url, { method: 'HEAD' });
		return res.ok;
	} catch {
		return false;
	}
}