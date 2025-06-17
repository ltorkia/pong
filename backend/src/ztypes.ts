import {z } from 'zod';
import { FastifyInstance } from 'fastify';
import { UserToRegister, GetUserForRegistration, GetUserForLogin } from './types';

export const safeRegister: z.ZodType<GetUserForRegistration> = z.object({
			pseudo : z.string(),
			email: z.string().email(),
			password: z.string().min(3),
		});

export const safeLogin: z.ZodType<GetUserForLogin> = z.object({
			email: z.string().email(),
			password: z.string().min(3),
		});