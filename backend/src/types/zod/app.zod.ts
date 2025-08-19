import { z } from 'zod';
import { FRIEND_REQUEST_ACTIONS, USER_ONLINE_STATUS } from '../../shared/config/constants.config';

export const IdInputSchema = z.object({
	id: z.number().int().positive(),
});

export const UsertatusSchema = z.enum([
	USER_ONLINE_STATUS.OFFLINE,
	USER_ONLINE_STATUS.ONLINE,
	USER_ONLINE_STATUS.IN_GAME
])

export const FriendActionInputSchema = z.enum([
	FRIEND_REQUEST_ACTIONS.ADD,
	FRIEND_REQUEST_ACTIONS.ACCEPT,
	FRIEND_REQUEST_ACTIONS.DELETE,
	FRIEND_REQUEST_ACTIONS.BLOCK,
]);

export const NotificationInputSchema = z.object({
	id: z.number().int().positive().optional(),
	from: z.number().int().positive(),
	to: z.number().int().positive(),
	type: z.union([
		FriendActionInputSchema,
		UsertatusSchema
	]).optional(),
	toType: z.union([
		FriendActionInputSchema,
		UsertatusSchema
	]).optional(),
	content: z.string().optional(),
	createdAt: z.string().optional(),
	read: z.number().optional()
});

export type IdInput = z.infer<typeof IdInputSchema>;
export type UserStatus = z.infer<typeof UsertatusSchema>;
export type FriendActionInput = z.infer<typeof FriendActionInputSchema>;
export type NotificationInput = z.infer<typeof NotificationInputSchema>;