import { NotificationModel } from '../types/notification.types';	// en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// NOTIFICATIONMODEL
// ===========================================

export class Notification {

	constructor(
		public id: number,
		public userId: number,
		public receiverId: number,
		public content: string,
		public createdAt: string,
		public status: number
	) {}

	// ============================================================================
	// MÉTHODE DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	public toJSON(): NotificationModel {
		return {
			id: this.id,
			userId: this.userId,
			receiverId: this.receiverId,
			content: this.content,
			createdAt: this.createdAt,
			status: this.status
		};
	}

	// ============================================================================
	// MÉTHODE DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	public static fromJSON(data: Partial<NotificationModel>): Notification {

		if (!data.id) {
			throw new Error('id manquant dans les données du modèle Notification');
		}

		return new Notification(
			data.id ?? 0,
			data.userId ?? 0,
			data.receiverId ?? 0,
			data.content ?? '',
			data.createdAt ?? '',
			data.status ?? 0
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX DE NOTIFS
	// ============================================================================

	public static fromJSONArray(notifs: Partial<NotificationModel>[]): Notification[] {
		return notifs.map(notif => this.fromJSON(notif));
	}

	public static toJSONArray(notifs: Notification[]): NotificationModel[] {
		return notifs.map(notif => notif.toJSON());
	}
}