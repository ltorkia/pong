import { BasePage } from './base.page';
import { RouteConfig } from '../types/routes.types';
import { userService } from '../services/services';

export class TwofaPage extends BasePage {

    constructor(config: RouteConfig) {
        super(config);
    }

    protected attachListeners(): void {
        const form: HTMLElement | null = document.getElementById('twofa-form');
        if (!(form instanceof HTMLFormElement)) {
            console.error('Formulaire non trouvé ou invalide');
            return;
        }

		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries()) as Record<string, string>;
			await userService.twofaConnectUser(data);
		});
	}
}
