import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { GoogleCallbackQuery, GoogleTokenResponse, GoogleUserInfo } from '../types/auth.types';
import {z } from 'zod';
import bcrypt from 'bcrypt';
import { insertUser, getUser, getUserP } from '../db';
import { UserToRegister, GetUserForRegistration } from '../types';
import { safeRegister, safeLogin } from '../ztypes';

export async function authRoutes(app: FastifyInstance) {
	app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
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

	app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
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

	// TODO: Ci-dessous authentification google + jwt ok, reste a faire 2FA pour completter le module cybersecu "Implement Two-Factor Authentication (2FA) and JWT"
	// Route qui redirige vers la page d'autorisation de Google quand on clique sur "sign in with Google"
	app.get('/google', async (request: FastifyRequest, reply: FastifyReply) => {
		// Construction de l'URL d'autorisation Google OAuth2
		const redirectUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
		
		// Configuration des paramètres requis par Google :
		redirectUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);			// ID de l'app Google
		redirectUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL!);		// Où Google doit rediriger après auth
		redirectUrl.searchParams.set('response_type', 'code');								// On veut recevoir un code d'autorisation
		redirectUrl.searchParams.set('scope', 'openid profile email');						// Permissions demandées (profil + email)
		redirectUrl.searchParams.set('access_type', 'offline');								// Pour pouvoir obtenir un refresh token
		redirectUrl.searchParams.set('prompt', 'consent');									// Force l'écran de consentement

		// Redirection vers Google pour que le user s'authentifie
		return reply.redirect(redirectUrl.toString());
	});

	// Une fois que le user s'est connecté sur Google, Google le redirige vers cette route
	app.get('/google/callback', async (request: FastifyRequest<{ Querystring: GoogleCallbackQuery }>, reply: FastifyReply) => {
		try {
			// Récupération des paramètres envoyés par Google dans l'URL
			const { code, error } = request.query;
			
			// On check si Google a renvoyé une erreur
			if (error) {
				return reply.status(400).send({ error: `Erreur OAuth: ${error}` });
			}
			
			// On check si le code d'autorisation est manquant
			if (!code) {
				return reply.status(400).send({ error: 'Code manquant' });
			}

			// On echange le code d'autorisation reçu de Google contre un access_token
			// (code temporaire qui ne permet pas d'accéder aux données, il faut l'échanger contre un access_token auprès de Google)
			const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					client_id: process.env.GOOGLE_CLIENT_ID!,			// ID de l'app
					client_secret: process.env.GOOGLE_CLIENT_SECRET!,	// Secret de l'app
					redirect_uri: process.env.GOOGLE_CALLBACK_URL!,		// Même URL de callback qu'à l'étape 1
					grant_type: 'authorization_code',					// Type d'échange OAuth2
					code,												// Le code reçu de Google
				}).toString(),
			});
			
			// Conversion de la réponse en JSON
			const tokenData = await tokenRes.json() as GoogleTokenResponse;

			// On check si Google a renvoyé une erreur lors de l'échange du code
			if (tokenData.error) {
				console.error('Erreur lors de l\'échange du code:', tokenData);
				return reply.status(400).send({ 
					error: 'Erreur lors de l\'authentification',
					details: tokenData.error_description 
				});
			}

			// On check si l'access_token est manquant dans la réponse
			if (!tokenData.access_token) {
				return reply.status(400).send({ error: 'Access token manquant' });
			}

			// Maintenant qu'on a un access_token valide on peut récupérer les infos de l'utilisateur
			const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` }, // Authentification avec le token
			});
			
			// Conversion des données utilisateur en JSON
			const userData = await userRes.json() as GoogleUserInfo;

			// On check si les données essentielles sont présentes
			if (!userData.id || !userData.email) {
				return reply.status(400).send({ error: 'Données utilisateur incomplètes' });
			}

			 // TODO: Vérifier si l'utilisateur existe déjà en bdd (par son email ou Google id)
			 // TODO: Si non créer un nouvel utilisateur

			// Création d'un token JWT qui sera utilisé par le frontend pour les requêtes authentifiées
			// JWT = JSON Web Token = format pour transporter des informations de manière sécurisée entre deux parties, ici le frontend et le backend.
			const token = jwt.sign(
				{
					// Données qu'on stocke dans le token (payload)
					id: userData.id,			// ID Google de l'utilisateur
					email: userData.email,		// Email de l'utilisateur
					name: userData.name,		// Nom complet
					avatar: userData.picture,	// URL de la photo de profil
				},
				process.env.JWT_SECRET!,		// Clé secrète pour signer le token
				{ expiresIn: '1h' }				// Le token expire dans 1 heure
			);

			// L'utilisateur est redirigé vers le frontend avec le token JWT dans l'URL
			return reply.redirect(`${process.env.GOOGLE_REDIRECT_FRONTEND}?token=${token}`);
			
		} catch (error) {
			console.error('Erreur dans le callback Google:', error);
			return reply.status(500).send({ error: 'Erreur serveur' });
		}
	});

}