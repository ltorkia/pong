import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page login
		super(container, '/templates/register.html');
	}

	protected attachListeners(): void {
		const form = document.getElementById('login-form');

		form.addEventListener('submit', async (event) => {
			event.preventDefault(); // Empêche l'envoi classique du formulaire

			// Récupérer les données du formulaire
			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries()); // transforme en objet JS

			// Envoyer les données en JSON avec fetch
			const response = await fetch('/api/auth/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json' // très important pour que le backend comprenne
			},
		body: JSON.stringify(data) // transforme l'objet JS en JSON
		});

		const result = await response.json();
		console.log(result);	
			// Tu peux ici gérer la réponse, afficher un message, etc.
	});

	// 	const registerForm = document.getElementById('register-form');
	// 	if (registerForm) {
	// 		registerForm.addEventListener('submit', (e) => {
	// 			e.preventDefault();
	// 			// Logique d'inscription dans une méthode de RegisterController dans le dossier controller
	// 		});
	// 	}
	}
}