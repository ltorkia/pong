import { NotificationModel, NotificationType } from '../types/notification.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { USER_ONLINE_STATUS } from '../config/constants.config';

// ===========================================
// APPNOTIFICATION MODEL
// ===========================================

export class AppNotification {

	constructor(
		public id: number,
		public from: number,
		public to: number,
		public type: NotificationType,
		public content: string | null,
		public createdAt: string | null,
		public read: number
	) {}

	// ============================================================================
	// MÉTHODE DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	public toJSON(): NotificationModel {
		return {
			id: this.id,
			from: this.from,
			to: this.to,
			type: this.type,
			content: this.content,
			createdAt: this.createdAt,
			read: this.read
		};
	}

	// ============================================================================
	// MÉTHODE DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	public static fromJSON(data: Partial<NotificationModel>): AppNotification {

		if (!data) {
			throw new Error('Données manquantes pour créer une notification');
		}

		return new AppNotification(
			data.id ?? 0,
			data.from ?? 0,
			data.to ?? 0,
			data.type ?? USER_ONLINE_STATUS.OFFLINE,
			data.content ?? '',
			data.createdAt ?? '',
			data.read ?? 0
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX DE NOTIFS
	// ============================================================================

	public static fromJSONArray(notifs: Partial<NotificationModel>[]): AppNotification[] {
		return notifs.map(notif => this.fromJSON(notif));
	}

	public static toJSONArray(notifs: AppNotification[]): NotificationModel[] {
		return notifs.map(notif => notif.toJSON());
	}
}