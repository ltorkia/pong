import {z } from 'zod';
import { FastifyInstance } from 'fastify';
import { UserToRegister, GetUserForRegistration, GetUserForLogin } from './types';

export const safeRegister: z.ZodType<GetUserForRegistration> = z.object({
			pseudo : z.string(),
			email: z.string().email(),
			password: z.string().min(3),
			question: z.coerce.number().int().min(1).max(4),
			answer: z.string(),
		});

export const safeLogin: z.ZodType<GetUserForLogin> = z.object({
			email: z.string().email(),
			password: z.string().min(3),
		});