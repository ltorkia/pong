import { z } from 'zod';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config';

export const IdInputSchema = z.object({
	id: z.number().int().positive(),
});

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
	type: FriendActionInputSchema.optional(),
	toType: FriendActionInputSchema.optional(),
	content: z.string().optional(),
	createdAt: z.string().optional(),
	status: z.number().optional()
});

export type IdInput = z.infer<typeof IdInputSchema>;
export type FriendActionInput = z.infer<typeof FriendActionInputSchema>;
export type NotificationInput = z.infer<typeof NotificationInputSchema>;