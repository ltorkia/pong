import { router } from '../../router/router';
import { AUTH_FALLBACK_ROUTE } from '../../config/routes.config';
import { userCrudApi } from '../../api/user/user-index.api';
import { showAlert } from '../../utils/dom.utils';
import { AuthResponse } from '../../types/api.types';

export class CrudService {

	/**
	 * Met à jour les propriétés de l'utilisateur avec de nouvelles données.
	 * 
	 * @param {number} id - Identifiant de l'utilisateur à mettre à jour
	 * @param {FormData} userData - Objet contenant les propriétés à mettre à jour
	 * @returns {Promise<void>} - Promesse qui se resout lorsque l'utilisateur est mis à jour
	 */
	async updateCurrentUser(id: number, userData: FormData): Promise<void> {
		const result: AuthResponse = await userCrudApi.updateUser(id, userData);
		if (result.errorMessage) {
			console.error(`[${this.constructor.name}] Erreur de mise à jour utilisateur :`, result);
			showAlert(result.errorMessage);
			return;
		}
		console.log(`[${this.constructor.name}] Utilisateur mis à jour :`, result);
		await router.redirect(AUTH_FALLBACK_ROUTE);
		showAlert('Successfully updated.', 'alert', 'success');
		return;
	}
}