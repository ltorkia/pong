import { BaseView } from '../BaseView';

export class RegisterView extends BaseView {

	constructor(container: HTMLElement) {
		super(container, '/templates/auth/register.html');
	}

	protected attachListeners(): void {

		const form = document.getElementById('register-form');
		if (!(form instanceof HTMLFormElement)) {
			console.error('Formulaire non trouvé ou invalide');
			return;
		}

		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries()) as Record<string, string>;
			await this.userController.registerController(data);
		});
	}
}
