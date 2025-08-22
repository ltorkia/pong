import { z } from 'zod';
import { USER_FILTERS, USER_ONLINE_STATUS, UserSortFieldEnum, SortOrderEnum } from '../../shared/config/constants.config';

export const SearchParamsSchema = z.object({
	searchTerm: z.string().trim().min(1).max(50).optional(),
	status: z.enum([
		USER_ONLINE_STATUS.ONLINE,
		USER_ONLINE_STATUS.OFFLINE,
		USER_ONLINE_STATUS.IN_GAME,
	]).optional(),
	level: z.preprocess(
		(val: any) => val !== undefined ? Number(val) : undefined,
		z.number().int().min(USER_FILTERS.LEVEL.MIN).max(USER_FILTERS.LEVEL.MAX).optional()
	),
	friendsOnly: z.preprocess(
		(val: any) => val === 'true',
		z.boolean().optional()
	),
	sortBy: z.nativeEnum(UserSortFieldEnum).optional(),
	sortOrder: z.nativeEnum(SortOrderEnum).optional(),
});

export type UsersPageQuery = z.infer<typeof SearchParamsSchema>;
