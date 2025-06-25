import { userManager } from '../managers/UserManager';
import { isPublicTemplate } from '../utils/navigation.utils';

/**
 * Fonction utilitaire pour déterminer si la navbar doit être affichée
 * Remplace shouldShowNavbar()
 */
export const shouldShowNavbar = (templatePath: string): boolean => {
	return !isPublicTemplate(templatePath);
};

/**
 * Récupère le chemin du profil de l'utilisateur connecté.
 */
export async function getProfilePath(): Promise<string | null> {
	const userLogStatus = await userManager.loadOrRestoreUser();
	console.log('[getProfilePath] userLogStatus =', userLogStatus);
	if (!userLogStatus || !userLogStatus.id) {
		return null;
	}
	return `/user/${userLogStatus.id}`;
}

/**
 * Modifie dynamiquement le lien du profil dans la barre de navigation pour pointer vers la page de l'utilisateur connecté.
 * Récupère l'état de connexion de l'utilisateur via loadOrRestoreUser()
 */
export async function setProfileLink(id = 'profile-nav'): Promise<void> {
	const profileLink = document.querySelector(id) as HTMLAnchorElement;
	const profilePath = await getProfilePath();
	if (profileLink && profilePath) {
		profileLink.href = profilePath;
	}
}

/**
 * Met à jour la navigation active sur la navbar.
 * 
 * - Sélectionne tous les liens avec l'attribut data-link.
 * - Supprime la classe active de tous les liens.
 * - Compare leur pathname avec celui passé en paramètre.
 * - Ajoute la classe active au lien correspondant.
 * 
 * Permet de styliser le lien actif dans la navbar.
 */
export function setActiveNavLink(pathname: string): void {
	const navLinks = document.querySelectorAll('.navbar-content a[data-link]') as NodeListOf<HTMLElement>;
	navLinks.forEach(link => {
		const anchor = link as HTMLAnchorElement;
		anchor.classList.remove('active');
		const linkPath = new URL(anchor.href).pathname;
		if (linkPath === pathname) {
			anchor.classList.add('active');
		}
	});
}