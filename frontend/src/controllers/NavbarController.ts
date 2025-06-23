import { PUBLIC_ROUTES } from '../config/public.routes';
import { setProfileLink } from '../utils/navbar.utils';

export function shouldShowNavbar(templatePath: string): boolean {
	const publicTemplates = PUBLIC_ROUTES.map(route => `/templates${route}.html`);
	return !publicTemplates.includes(templatePath);
}

export async function setupNavbar(): Promise<void> {
    await setProfileLink();
	
	// Menu burger pour mobile/tablet
	const burgerBtn = document.getElementById('burger-btn');
	const navbarMenu = document.getElementById('navbar-menu');
	const icon = burgerBtn?.querySelector('i');

	burgerBtn?.addEventListener('click', () => {

		// On transforme les trois barres en X
		if (icon?.classList.contains('fa-bars')) {
			icon.classList.remove('fa-bars');
			icon.classList.add('fa-xmark');
			icon.classList.add('text-blue-300');
		} else {
			icon?.classList.remove('text-blue-300');
			icon?.classList.remove('fa-xmark');
			icon?.classList.add('fa-bars');
		}
		
		// On affiche ou on cache le menu
		if (navbarMenu?.classList.contains('show')) {
			navbarMenu?.classList.remove('show');
			navbarMenu?.classList.add('hide');
		} else {
			navbarMenu?.classList.remove('hide');
			navbarMenu?.classList.add('show');
		}
	});

    // On pourra ajouter ici d'autres personnalisations genre notifications etc...
}