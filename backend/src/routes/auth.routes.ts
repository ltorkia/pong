import { FastifyInstance } from 'fastify';
import {z } from 'zod';
import bcrypt from 'bcrypt';
import { insertUser, getUser, getUserP } from '../db';
import { UserToRegister, GetUserForRegistration } from '../types';
import { safeRegister, safeLogin } from '../ztypes';

export async function authRoutes(app: FastifyInstance) {
	app.post('/login', async (request, reply) => {
		let resultlogin;
		const result = safeLogin.safeParse(request.body)
		if (!result.success)
		{
			console.log("Error de Zod = ", result.error.errors[0].path, " : ", result.error.errors[0].message);
			resultlogin = {
				errorPath: result.error.errors[0].path, //trouver comment typer
				errorMessage: result.error.errors[0].message, //trouver comment typer
				statusCode: 400
			}			
		}
		else
		{
			const UserToLog = result.data;
			const validUser = await getUserP(UserToLog.email);
			if (!validUser)
			{
				resultlogin = {
					statusCode: 401,
					errorMessage: "email invalid or unknown"
				}
			}
			else
			{
				const ispassvalid = await bcrypt.compare(UserToLog.password, (await validUser).password);
				if (!ispassvalid)
					resultlogin = {
						statusCode: 402, //a modifier en fonction du code erreur souhaite
						errorMessage: "password doesn t match"
				}
				else {
					resultlogin = {
						statusCode: 200, //a modifier en fonction du code erreur souhaite
						errorMessage: "ok"
					}
					// ✅ Génère le token JWT
					const token = app.jwt.sign({ id: validUser.id, email: validUser.email });
					// ✅ Envoie le token dans un cookie HTTP-only
					reply.setCookie('auth_token', token, {
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						// secure: process.env.NODE_ENV === 'production', // true en prod
						maxAge: 60 * 60 * 24 * 7 // 7 jours
					  })
				}
			
			}
		}
		reply.status(resultlogin.statusCode).send(JSON.stringify(resultlogin))
	});

	app.post('/register', async (request, reply) => {
		console.log(request.body);
		const result = safeRegister.safeParse(request.body);
		// console.log("Résultat de safeParse :", result);
		let resultinsert;
		if (!result.success)
		{
			console.log("Error de Zod = ", result.error.errors[0].path, " : ", result.error.errors[0].message);
			resultinsert = {
				errorPath: result.error.errors[0].path, //trouver comment typer
				errorMessage: result.error.errors[0].message, //trouver comment typer
				statusCode: 400
			}
			// reply.status(400).send({
			// 	errorPath: result.error.errors[0].path,
			// 	errorMessage: result.error.errors[0].message});
			// return;
		}
		else 
		{
			// console.log("test");
			const validUser = result.data;
			validUser.password = await bcrypt.hash(validUser.password, 10);
			resultinsert = await insertUser(validUser);
		}
		reply.status(resultinsert.statusCode).send(JSON.stringify(resultinsert));
		return;
	});
}
