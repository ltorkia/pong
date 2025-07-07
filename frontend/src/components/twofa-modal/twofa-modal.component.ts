// Pour hot reload Vite
import template from './twofa-modal.component.html?raw'

import { userService } from '../../services/services';
import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { showError, showSpinner, hideSpinner } from '../../utils/dom.utils';

// ===========================================
// TWOFA MODAL COMPONENT
// ===========================================

export class TwofaModalComponent extends BaseComponent {
	private userData!: Record<string, string>;
	private codeInput!: HTMLInputElement;
	private errorMsg!: HTMLElement;
	private twofaMethodSelect!: HTMLSelectElement;
	private emailContainer!: HTMLElement;
	private qrcodeContainer!: HTMLElement;
	private submitEmailCodeBtn!: HTMLButtonElement;
	private resendEmailCodeBtn!: HTMLButtonElement;
	private twofaBackBtn!: HTMLButtonElement;

	/**
	 * Constructeur.
	 *
	 * Stocke la configuration de la route actuelle, la configuration du composant,
	 * et le container HTML.
	 *
	 * @param {RouteConfig} routeConfig La configuration de la route actuelle.
	 * @param {ComponentConfig} componentConfig La configuration du composant.
	 * @param {HTMLElement} container L'élément HTML qui sera utilisé comme conteneur pour le composant.
	 */
	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement) {
		super(routeConfig, componentConfig, container);
	}

	protected async mount(): Promise<void> {
		if (import.meta.env.DEV === true) {
			this.container.innerHTML = template;
			console.log(`[${this.constructor.name}] Hot-reload actif`);
		}
	}

	protected attachListeners(): void {
		this.codeInput = this.container.querySelector('#twofa-code')!;
		this.errorMsg = this.container.querySelector('#twofa-error')!;
		this.twofaMethodSelect = this.container.querySelector('#twofa-method')!;
		this.emailContainer = this.container.querySelector('#twofa-email-container')!;
		this.qrcodeContainer = this.container.querySelector('#twofa-qrcode-container')!;
		this.submitEmailCodeBtn = this.container.querySelector('#twofa-email-code-submit-btn')!;
		this.resendEmailCodeBtn = this.container.querySelector('#twofa-email-resend-btn')!;
		this.twofaBackBtn = this.container.querySelector('#twofa-back-btn')!;
		
		this.twofaMethodSelect.addEventListener('change', this.handleMethodChange);
		this.resendEmailCodeBtn.addEventListener('click', this.handleResendEmailCode);
		this.submitEmailCodeBtn.addEventListener('click', this.handleSubmit);
		this.container.addEventListener('click', this.handleBackgroundClick);
		this.twofaBackBtn.addEventListener('click', this.leaveOnBtnClick);
	}

	private handleMethodChange = async (event: Event): Promise<void> => {
		const method = (event.target as HTMLSelectElement).value;
		if (method === 'email') {
			this.handleSendEmailCode();
		}
		if (method === 'qrcode') {
			this.qrcodeContainer.classList.remove('hidden');
			this.emailContainer.classList.add('hidden');
			this.errorMsg.classList.add('hidden');
		}
	};

	private handleSubmit = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		const code = this.codeInput.value.trim();
		if (!code) {
			showError('Code required', 'twofa-error');
			this.errorMsg.classList.remove('hidden');
			return;
		}
		const res = await userService.twofaConnectUser({
			email: this.userData.email,
			password: code,
		});
		if (res.errorMessage) {
			showError(res.errorMessage, 'twofa-error');
			this.errorMsg.classList.remove('hidden');
			return;
		}
		await this.hide();
	};

	private async handleSendEmailCode(): Promise<void> {
		showSpinner('twofa-spinner');
		const res = await userService.send2FA(this.userData);
		if (res.errorMessage) {
			showError(res.errorMessage, 'twofa-error');
			this.qrcodeContainer.classList.add('hidden');
			return;
		}
		hideSpinner('twofa-spinner');
		showError(`Code sent to ${this.userData.email}`, 'twofa-error', 'success');
		this.emailContainer.classList.remove('hidden');
		this.qrcodeContainer.classList.add('hidden');
	}

	private handleResendEmailCode = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		this.errorMsg.classList.add('hidden');
		this.handleSendEmailCode();
	}

	private handleBackgroundClick = async (event: MouseEvent): Promise<void> => {
		if (event.target === this.container) {
			await this.hide();
		}
	};

	private leaveOnBtnClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		await this.hide();
	};

	public setUserData(userData: Record<string, string>): void {
		this.userData = userData;
	}

	public async show(): Promise<void> {
		this.container.classList.remove('hidden');
		this.codeInput.value = '';
		this.errorMsg.classList.add('hidden');
		await this.modalTransitionIn();
	}

	public async hide(): Promise<void> {
		await this.modalTransitionOut();
		this.container.classList.add('hidden');
		this.reset();
	}

	/**
	 * Transition du modal vers l'entrée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	private async modalTransitionIn(): Promise<void> {
		this.container.classList.add('modal-active');
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	/**
	 * Transition du modal vers la sortie.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	private async modalTransitionOut(): Promise<void> {
		this.container.classList.remove('modal-active');
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	/**
	 * Supprime les gestionnaires d'événement.
	 */
	protected removeListeners(): void {
		this.twofaMethodSelect.removeEventListener('change', this.handleMethodChange);
		this.resendEmailCodeBtn.removeEventListener('click', this.handleResendEmailCode);
		this.container.removeEventListener('click', this.handleBackgroundClick);
		this.submitEmailCodeBtn.removeEventListener('click', this.handleSubmit);
		this.twofaBackBtn.removeEventListener('click', this.leaveOnBtnClick);
	}

	private reset(): void {
		// Réinitialise les champs
		this.codeInput.value = '';

		// Cache les messages d’erreur
		this.errorMsg.classList.add('hidden');
		this.errorMsg.textContent = '';

		// Réinitialise la sélection
		this.twofaMethodSelect.value = '-';

		// Cache le champ d’email si visible
		this.emailContainer.classList.add('hidden');

		// Cache le champ de QR code si visible
		this.qrcodeContainer.classList.add('hidden');
	}

}