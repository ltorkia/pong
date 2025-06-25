import { BaseView } from '../BaseView';

export class RegisterView extends BaseView {

	constructor(container: HTMLElement) {
		super(container, '/templates/auth/register.html');
	}

	protected bindEvents(): void {

		// // WebSocket simple pour test
		// const socket = new WebSocket('wss://localhost:8443/ws');
		
		// socket.addEventListener('open', () => {
		// console.log('WebSocket connecté');
		// });
		
		// socket.addEventListener('message', (event) => {
		// console.log('Message du serveur :', event.data);
		// });

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
