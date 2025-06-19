import { PUBLIC_ROUTES } from '../config/public.routes';
import { setProfileLink } from '../utils/navbar.utils';

export function shouldShowNavbar(templatePath: string): boolean {
	const publicTemplates = PUBLIC_ROUTES.map(route => `/templates${route}.html`);
	return !publicTemplates.includes(templatePath);
}

export async function setupNavbar(): Promise<void> {
    await setProfileLink();
    // On pourra ajouter ici d'autres personnalisations genre notifications etc...
}