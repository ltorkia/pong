import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
	constructor(container: HTMLElement) {
		super(container, '/templates/register.html');
	}
	
	protected attachListeners(): void {
		// // WebSocket simple pour test
		// const socket = new WebSocket('wss://localhost:8443/ws');
		
		// socket.addEventListener('open', () => {
		// console.log('✅ WebSocket connecté');
		// });
		
		// socket.addEventListener('message', (event) => {
		// console.log('📩 Message du serveur :', event.data);
		// });
		
		const form = document.getElementById('register-form');
		
		if (!(form instanceof HTMLFormElement)) {
			console.error('Formulaire non trouvé ou invalide');
			return;
		}

		form.addEventListener('submit', async (event) => {
			event.preventDefault();

			// Récupérer les données du formulaire
			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries());

			try {
				const response = await fetch('/api/auth/register', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				});

				const result = await response.json();

				if (!response.ok) {
					console.error('Erreur d’inscription :', result);
					alert(`Erreur : ${result.message || 'Inconnue'}`);
				} else {
					console.log('Utilisateur inscrit :', result);
					alert('Inscription réussie !');
				}
			} catch (err) {
				console.error('Erreur réseau ou serveur', err);
				alert('Erreur réseau.');
			}
		});

	}
}
