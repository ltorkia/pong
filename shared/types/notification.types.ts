/**
 * Représente une notification envoyée à un utilisateur.
 */
export interface NotificationModel {
	id: number;
	userId: number;
	receiverId: number;
	content: string;
	createdAt: string;
	status: number;
};