import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { GoogleCallbackQuery, GoogleTokenResponse, GoogleUserInfo } from '../types/google.types';
import { insertUser, getUser, getUserP, majLastlog, eraseCode2FA, insertCode2FA, getUser2FA } from '../db/user';
import { RegisterInputSchema, LoginInputSchema } from '../types/zod/auth.zod';
import { generateJwt, setAuthCookie, setStatusCookie, clearAuthCookies, setPublicUserInfos } from '../helpers/auth.helpers';
import { UserModel } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { UserPassword } from 'src/types/user.types';
import { JwtPayload } from '../types/jwt.types';
import nodemailer from 'nodemailer';

async function ProcessAuth(app: FastifyInstance, user: UserModel, reply: FastifyReply)
{
	// const user = await getUser(null, userToGet);
	// Création d'un token JWT qui sera utilisé par le frontend pour les requêtes authentifiées
	// JWT = JSON Web Token = format pour transporter des informations de manière sécurisée entre deux parties, ici le frontend et le backend.
	const token = generateJwt(app, {
		id: user.id
	});
	setAuthCookie(reply, token);
	setStatusCookie(reply);
	await majLastlog(user.username);
}


const PORT = 3001;


async function doubleAuth(app: FastifyInstance)
{
	app.post('/2FAsend', async (request: FastifyRequest, reply: FastifyReply) => {
		const user = await LoginInputSchema.safeParse(request.body);
		if (!user.success) {
			const error = user.error.errors[0];
			console.log(error);
			return reply.status(400).send({statusCode: 400, errorMessage: error.message + " in " + error.path });
		}
		try {
			const code = Math.floor(100000 + Math.random() * 900000).toString();
			const resInsert = await insertCode2FA(user.data.email, code);
			const transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.EMAIL_2FA,
					pass: process.env.PASS_EMAIL,
				},
			});
			
			await transporter.sendMail({
				// from: '"Sécurité" <no-reply@transcendance.com>',
				from: '"Sécurité" <lee.torkia@gmail.com>',
				to: user.data.email,
				subject: 'Votre code de vérification',
				text: `Votre code est : ${code}`,
			});
		} catch (err) {
			console.log(err)
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de l envoi 2FA',
			});
		}
		// const redirectUrl = new URL('');
		// reply.redirect()->
		return(reply.status(200).send("2FA send"));
	} );

	app.post('/2FAreceive', async (request: FastifyRequest, reply: FastifyReply) => {
		const result = LoginInputSchema.safeParse(request.body); //c est le meme format que pour login input avec les memes checks
		if (!result.success) {
			const error = result.error.errors[0];
			return reply.status(400).send({
				statusCode : 400,
				errorMessage: error.message + " in " + error.path
			});
		}
		const checkUser = await getUser2FA(result.data.email);
		if (!checkUser )
			return (reply.status(400).send({message:"email doesn t exist"}));
		eraseCode2FA(checkUser.email);
		if (checkUser.code_2FA_expire_at < Date.now())
			return(reply.status(400).send({message:"timeout, send new mail ?"}));
		if (result.data.password != checkUser.code_2FA)
			return(reply.status(400).send({message:"2FA not confirmed, try again"}));
		ProcessAuth(app, checkUser, reply);
		return reply.status(200).send({
			message: 'Connexion réussie',
			user: {checkUser},
			statusCode: 200
		});
		// return(reply.status(200).send({message:"2FA confirmed"}));
	});
}

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
				const user: UserModel = await getUser(null, userToInsert.email);
				ProcessAuth(app, user, reply);
				return reply.status(200).send({
					message: 'Successful registration.',
					user: user,
					statusCode: 200 // -> convention json pour donner toutes les infos au front
				});
			}
			return reply.status(resultinsert.statusCode).send(resultinsert);
	
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

			const validUser: UserPassword | null = await getUserP(result.data.email);
			if (!validUser) {
				return reply.status(401).send({
					statusCode: 401,
					errorMessage: 'Email invalid or unknown.'
				});
			}

			if(validUser && validUser.register_from == 'google')
			{
				return reply.status(402).send({
					statusCode: 402,
					errorMessage: 'Email already register from Google.'
				});				
			}
			
			const isPassValid = await bcrypt.compare(result.data.password, validUser.password);
			if (!isPassValid) {
				return reply.status(401).send({
					statusCode: 401,
					errorMessage: 'Password does not match.'
				});
			}
			ProcessAuth(app, validUser, reply);
			const user: UserModel | null = await getUser(null, result.data.email);
			if (!user) {
				return reply.status(500).send({
					errorMessage: 'Impossible de récupérer l’utilisateur après insertion',
				});
			}
			return reply.status(200).send({
				message: 'Successfully logged in.',
				user: user,
				statusCode: 200
			});

		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de la connexion',
			});
		}
	});

	doubleAuth(app); //si deja fait voir si on genere pas un cookie type pour pas avoir a le refaire une seconde fois quand on se log sur le mm ordi

	// LOGOUT
	app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
		clearAuthCookies(reply);
		return reply.status(200).send({ message: 'Déconnecté' });
	});

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

			let userGoogle: UserModel | null = await getUser(null, userData.email);
			if (userGoogle && userGoogle.password)
				return (reply.redirect(process.env.GOOGLE_REDIRECT_FRONTEND! + "?autherror=1"));

			// TODO: Insère l'utilisateur seulement s'il n'existe pas en bdd
			// TODO: Logique à améliorer, j'ai juste mis ça pour régler un probleme
			if (!userGoogle) {
				const result = await insertUser({ email: userData.email, username: userData.given_name, avatar: userData.picture }, true);
				userGoogle = await getUser(null, userData.email);
				if (!userGoogle) {
					return reply.status(500).send({
						errorMessage: 'Impossible de récupérer l’utilisateur après insertion',
					});
				}
			}
			ProcessAuth(app, userGoogle, reply);

			// // Création d'un token JWT qui sera utilisé par le frontend pour les requêtes authentifiées
			// // JWT = JSON Web Token = format pour transporter des informations de manière sécurisée entre deux parties, ici le frontend et le backend.
			// const token = generateJwt(app, {
			// 	id: userGoogle.id
			// });

			// await majLastlog(userGoogle.username);
			// setAuthCookie(reply, token);
			// setStatusCookie(reply);

			// Redirection simple sans token dans l'URL
			return reply.redirect(process.env.GOOGLE_REDIRECT_FRONTEND!);
		} catch (err) {
			console.error('Erreur callback Google:', err);
			return reply.status(500).send({ error: 'Erreur serveur' });
		}
	});

	//login -> status a 1 ou status a 0
}