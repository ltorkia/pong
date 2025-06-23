import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { GoogleCallbackQuery, GoogleTokenResponse, GoogleUserInfo } from '../types/google.types';
import { insertUser, getUserP, majLastlog } from '../db/user';
import { RegisterInputSchema, LoginInputSchema } from '../types/zod/auth.zod';
import { generateJwt, setAuthCookie, setStatusCookie, clearAuthCookies } from '../helpers/auth.helpers';

export async function authRoutes(app: FastifyInstance) {
	
	// REGISTER
	app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const result = RegisterInputSchema.safeParse(request.body);
	
			if (!result.success) {
				const error = result.error.errors[0];
				return reply.status(400).send({statusCode: 400, errorMessage: error.message + " in " + error.path });
			}
			const userToInsert = result.data;
			userToInsert.password = await bcrypt.hash(userToInsert.password, 10);
	
			const resultinsert = await insertUser(userToInsert, null);

			if (resultinsert.statusCode === 201) {
				const user = await getUserP(userToInsert.email);
				const token = generateJwt(app, {
					id: user.id,
					email: user.email,
					name: user.username,
				});

				await majLastlog(user.username);
				setAuthCookie(reply, token);
				setStatusCookie(reply);

				return reply.status(200).send({
					message: 'Inscription réussie',
					user: { id: user.id, username: user.username }
				});
			
			} else {
				return reply.status(resultinsert.statusCode).send(resultinsert);
			}
	
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de l’inscription',
			});
		}
	});

	// LOGIN
	app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const result = LoginInputSchema.safeParse(request.body);

			if (!result.success) {
				const error = result.error.errors[0];
				return reply.status(400).send({
					statusCode : 400,
					errorMessage: error.message + " in " + error.path
				});
			}

			const validUser = await getUserP(result.data.email);
			if (!validUser) {
				return reply.status(401).send({
					statusCode: 401,
					errorMessage: 'Email invalid or unknown'
				});
			}
			
			const isPassValid = await bcrypt.compare(result.data.password, validUser.password);
			if (!isPassValid) {
				return reply.status(401).send({
					statusCode: 401,
					errorMessage: 'Password does not match'
				});
			}

			const token = generateJwt(app, {
				id: validUser.id,
				email: validUser.email,
				name: validUser.username,
			});
			console.log(validUser.username);
			await majLastlog(validUser.username);
			setAuthCookie(reply, token);
			setStatusCookie(reply);

			return reply.status(200).send({
				message: 'Connexion réussie',
				user: { id: validUser.id, username: validUser.username }
			});

		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de la connexion',
			});
		}
	});

	// LOGOUT
	app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
		clearAuthCookies(reply);
		reply.send({ message: 'Déconnecté' })});



	// LOGIN AVEC GOOGLE
	// Route qui redirige vers la page d'autorisation de Google quand on clique sur "sign in with Google"
	app.get('/google', async (request: FastifyRequest, reply: FastifyReply) => {
		// Construction de l'URL d'autorisation Google OAuth2
		const redirectUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

		// Configuration des paramètres requis par Google :
		redirectUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
		redirectUrl.searchParams.set('redirect_uri', process.env.GOOGLE_CALLBACK_URL!);
		redirectUrl.searchParams.set('response_type', 'code');
		redirectUrl.searchParams.set('scope', 'openid profile email');
		redirectUrl.searchParams.set('access_type', 'offline');
		redirectUrl.searchParams.set('prompt', 'consent');

		// Redirection vers Google pour que le user s'authentifie
		return reply.redirect(redirectUrl.toString());
	});

	// CALLBACK GOOGLE
	// Une fois que le user s'est connecté sur Google, Google le redirige vers cette route
	app.get('/google/callback', async (request: FastifyRequest<{ Querystring: GoogleCallbackQuery }>, reply: FastifyReply) => {
		const { code, error } = request.query;
  		console.log('Google callback hit', request.query);

		// On check si Google a renvoyé une erreur
		if (error) return reply.status(400).send({ error: `Erreur OAuth: ${error}` });

		// On check si le code d'autorisation est manquant
		if (!code) return reply.status(400).send({ error: 'Code manquant' });

		try {

			// On échange le code d'autorisation reçu de Google contre un access_token
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

			const tokenData = await tokenRes.json() as GoogleTokenResponse;
			console.log('Google token response:', tokenData);

			// On check si Google a renvoyé une erreur lors de l'échange du code
			if (tokenData.error) {
				return reply.status(400).send({ error: 'Erreur authentification Google', details: tokenData.error_description });
			}

			// On récupère les infos du user via l'access_token
			const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: { Authorization: `Bearer ${tokenData.access_token}` },
			});
			const userData = await userRes.json() as GoogleUserInfo;

			// On check si les données essentielles sont présentes
			if (!userData.id || !userData.email) {
				return reply.status(400).send({error: 'Données utilisateur incomplètes' }); //retourne objet vec statuscode ? 
			}

			let userGoogle = await getUserP(userData.email);

			// TODO: Insère l'utilisateur seulement s'il n'existe pas en bdd
			// TODO: Logique à améliorer, j'ai juste mis ça pour régler un probleme
			if (!userGoogle) {
				await insertUser({ email: userData.email, username: userData.given_name }, true);
				userGoogle = await getUserP(userData.email);
				if (!userGoogle) {
					return reply.status(500).send({ error: 'Impossible de récupérer l’utilisateur après insertion' });
				}
			}

			// Création d'un token JWT qui sera utilisé par le frontend pour les requêtes authentifiées
			// JWT = JSON Web Token = format pour transporter des informations de manière sécurisée entre deux parties, ici le frontend et le backend.
			const token = generateJwt(app, {
				id: userGoogle.id,
				email: userData.email,
				name: userData.given_name,
				avatar: userData.picture,
			});

			await majLastlog(userData.given_name);
			setAuthCookie(reply, token);
			setStatusCookie(reply);

			// Redirection simple sans token dans l'URL
			return reply.redirect(process.env.GOOGLE_REDIRECT_FRONTEND!);
		} catch (err) {
			console.error('Erreur callback Google:', err);
			return reply.status(500).send({ error: 'Erreur serveur' });
		}
	});
}