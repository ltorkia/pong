import { BasePage } from './BasePage';

export class LoginPage extends BasePage {

	constructor(container: HTMLElement) {
		super(container, '/templates/login.html');
	}
	
	protected attachListeners(): void {
		
		const form = document.getElementById('login-form');
		
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
				const response = await fetch('/api/auth/login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				});
				// console.log("jesuisla");

				const result = await response.json();

				if (!response.ok) {
					console.error('Erreur d’inscription :', result);
					alert(`Erreur : ${result.message || 'Inconnue'}`);
				} else {
					console.log('Utilisateur connexion :', result);
					alert('Connexion réussie !');
				}
			} catch (err) {
				console.error('Erreur réseau ou serveur', err);
				alert('Erreur réseau.');
			}
		});

	}
}
