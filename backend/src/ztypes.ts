import {z } from 'zod';
import { FastifyInstance } from 'fastify';
import { UserToRegister, GetUserForRegistration } from './types';

export const safeRegister: z.ZodType<GetUserForRegistration> = z.object({
			pseudo : z.string(),
			email: z.string().email(),
			password: z.string().min(3),
		});