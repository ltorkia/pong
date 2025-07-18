import { userCrudApi } from '../../api/user/user-index.api';
import { showAlert } from '../../utils/dom.utils';
import { AuthResponse } from '../../types/api.types';

export class CrudService {

	/**
	 * Met à jour les propriétés de l'utilisateur avec de nouvelles données.
	 * 
	 * @param {number} id - Identifiant de l'utilisateur à mettre à jour
	 * @param {Record<string, string>} userData - Objet contenant les propriétés à mettre à jour
	 * @returns {Promise<void>} - Promesse qui se resout lorsque l'utilisateur est mis à jour
	 */
	public async updateCurrentUser(id: number, userData: Record<string, string>): Promise<void> {
		const result: AuthResponse = await userCrudApi.updateUser(id, userData);
		if (result.errorMessage) {
			console.error(`[${this.constructor.name}] Erreur de mise à jour utilisateur.`);
			showAlert(result.errorMessage);
			return;
		}
		console.log(`[${this.constructor.name}] Utilisateur mis à jour.`);
		showAlert('Infos successfully updated.', 'alert', 'success');
		return;
	}

	/**
	 * Met à jour l'avatar de l'utilisateur courant.
	 * 
	 * Fait une requête API pour mettre à jour l'avatar de l'utilisateur courant.
	 * Si la requête réussit, affiche un message de succès et return true.
	 * 
	 * @param {number} id - Identifiant de l'utilisateur courant.
	 * @param {FormData} formData - Données de l'avatar à mettre à jour.
	 * @returns {Promise<boolean>} - Promesse qui se resout lorsque l'avatar est mis à jour.
	 */ 
	public async updateCurrentAvatar(id: number, formData: FormData): Promise<boolean> {
		const result: AuthResponse = await userCrudApi.updateAvatar(id, formData);
		if (result.errorMessage) {
			console.error(`[${this.constructor.name}] Erreur de mise à jour de l'avatar utilisateur.`);
			showAlert(result.errorMessage);
			return false;
		}
		console.log(`[${this.constructor.name}] Avatar de l'utilisateur mis à jour.`);
		showAlert('Image successfully uploaded.', 'alert', 'success');
		return true;
	}
}