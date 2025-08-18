import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { RegisterInput, RegisterInputSchema, LoginInputSchema, TwoFAInputSchema, TwoFAInput, LoginInput } from '../types/zod/auth.zod';
import { insertUser, getUser, getUserP, getUser2FA } from '../db/user';
import { eraseCode2FA } from '../db/usermaj';
import { ProcessAuth, clearAuthCookies,  GenerateEmailCode, GenerateQRCode  } from '../helpers/auth.helpers';
import { GetAvatarFromBuffer, bufferizeStream } from '../helpers/image.helpers';
import { JwtPayload,GoogleUserInfo, UserPassword, User2FA, FastifyFileSizeError, AvatarResult } from '../types/user.types';
import { UserModel } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { DB_CONST, USER_ONLINE_STATUS } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { Buffer } from 'buffer';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import * as speakeasy from 'speakeasy';
import { checkParsing, isParsingError } from '../helpers/types.helpers';
import { setOnlineStatus } from '../helpers/notifications.helpers';


/* ======================== AUTHENTICATION ROUTES ======================== */

export async function authRoutes(app: FastifyInstance) {

	/* -------------------------------------------------------------------------- */
	/*                 🔐 REGISTER - Enregistre l'utilisateur                     */
	/* -------------------------------------------------------------------------- */

	app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const elements = await request.parts({
				limits: {
    			fileSize: 5 * 1024 * 1024}
			}); //separe les differents elements recuperes

			let dataText: Record<string, string> = {}; //stockera les elements textes
			let avatarFile; //stockera le file de l avatar
			let avatarBuffer: Buffer | null = null; //buffer de l'avatar pour la sauvegarde en deux parties


			//preparsing qui dispatch datatext d un cote et l avatar de l autre
			for await (const element of elements) {
				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
					avatarFile = element;
					avatarBuffer = await bufferizeStream(element.file);
				} else if (element.type === 'field' && typeof element.value === 'string') {
					dataText[element.fieldname] = element.value;
				}
			}


			const userdataCheck = await checkParsing(RegisterInputSchema, dataText);
			if (isParsingError(userdataCheck))
				return reply.status(400).send(userdataCheck);
			let userToInsert = userdataCheck as RegisterInput;

			//on hash le password dans un souci de confidentialite
			userToInsert.password = await bcrypt.hash(userToInsert.password, 10);

			const resultinsert = await insertUser(userToInsert, null);
			if (resultinsert.statusCode !== 201) {
				return reply.status(resultinsert.statusCode).send({
					statusCode: resultinsert.statusCode,
					errorMessage: resultinsert.message || 'Erreur lors de l’insertion de l’utilisateur',
				});
			}
			
			const userInfos: UserPassword = await getUserP(userToInsert.email);
			if (avatarFile && avatarBuffer) {
				const result: AvatarResult = await GetAvatarFromBuffer(reply, userInfos, avatarFile.mimetype, avatarBuffer);
				if (result.success === false) {
					return reply.status(result.statusCode!).send({
						statusCode: result.statusCode,
						errorMessage: result.errorMessage || 'Erreur lors de l’insertion de l’avatar',
					});
				}
			}

			let user = await getUser(null, userToInsert.email);
			await ProcessAuth(app, userInfos, reply);

			return reply.status(200).send({
				statusCode: 200,
				user: user,
				message: 'Successful registration.'
			});

			
		} catch (err) {

			const e = err as FastifyFileSizeError;

			request.log.error(err);
			if (e.code === 'FST_REQ_FILE_TOO_LARGE') {
    			return (reply.status(413).send({ errorMessage: "Fichier trop volumineux (max 5 Mo)" }));}
			return reply.status(500).send({
				errorMessage: 'Erreur serveur lors de l\'inscription',
			});
		}
	});

	/* -------------------------------------------------------------------------- */
	/*                    🔐 LOGIN - Connecte l'utilisateur                       */
	/* -------------------------------------------------------------------------- */

	app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
		try {

			const userdataCheck = await checkParsing(LoginInputSchema, request.body);
			if (isParsingError(userdataCheck))
				return reply.status(400).send(userdataCheck);
			let data = userdataCheck as LoginInput;

			const validUser: UserPassword | null = await getUserP(data.email);
			if (!validUser) {
				return reply.status(401).send({
					statusCode: 401,
					errorMessage: 'Email invalid or unknown.'
				});
			}

			if (validUser && validUser.registerFrom === DB_CONST.USER.REGISTER_FROM.GOOGLE) {
				return reply.status(402).send({
					statusCode: 402,
					errorMessage: 'Email already register from Google.'
				});
			}

			const isPassValid = await bcrypt.compare(data.password, validUser.password);
			if (!isPassValid) {
				return reply.status(401).send({
					statusCode: 401,
					errorMessage: 'Password does not match.'
				});
			}

			const user: UserModel = await getUser(validUser.id);
			if (user.active2Fa === DB_CONST.USER.ACTIVE_2FA.DISABLED) {
				await ProcessAuth(app, validUser, reply);
			}

			return reply.status(200).send({
				statusCode: 200,
				user: user,
				message: 'All infos are correct.'
			});
			
		} catch (err) {
			request.log.error(err);
			return reply.status(500).send({
				statusCode: 500,
				errorMessage: 'Erreur serveur lors de la connexion',
			});
		}
	});

	/* -------------------------------------------------------------------------- */
	/*                   🔐 2FA - Double Authentification - send                  */
	/* -------------------------------------------------------------------------- */
	// :method -> methode souhaitee pour double authentification : email ou qrcode
	// send -> envoie la requete au service de connection lie : 
	// - email -> envoie un email a l utilisateur
	// -qrcode -> requete aupres de la db si deja fait / si vient de Setting au service concerne pour parametrer

    app.post('/2FAsend/:method', async (request: FastifyRequest, reply: FastifyReply) => {
		const { method } = request.params as { method: string };
		const userdataCheck = await checkParsing(TwoFAInputSchema, request.body);
		if (isParsingError(userdataCheck))
			return reply.status(400).send(userdataCheck);
		const userdata = userdataCheck as TwoFAInput;

		const user = await getUser2FA(userdata.email);

        try {
			if (method === DB_CONST.USER.ACTIVE_2FA.EMAIL_CODE && (userdata.pageName === 'Settings' || user.active2Fa === DB_CONST.USER.ACTIVE_2FA.EMAIL_CODE)) //a changer apres avec = email
				return await GenerateEmailCode(reply, userdata.email);
			else if (method === DB_CONST.USER.ACTIVE_2FA.QR_CODE && (userdata.pageName === 'Settings'))
				return await GenerateQRCode(reply, userdata.email);

			return (reply.status(200).send({
				statusCode: 200,
				message: 'Rentrez le code de votre app mobile'
			}));

        } catch (err) {
            request.log.error(err);
            return reply.status(500).send({
                statusCode: 500,
                errorMessage: 'Erreur serveur lors de l\'envoi 2FA'
            });
        }
    });

	/* -------------------------------------------------------------------------- */
	/*                   🔐 2FA - Double Authentification - receive               */
	/* -------------------------------------------------------------------------- */
	// :method -> methode souhaitee pour double authentification : email ou qrcode
	// receive -> check si le code entre est correct por valider l authentification

    app.post('/2FAreceive/:method', async (request: FastifyRequest, reply: FastifyReply) => {
		const { method } = request.params as { method: string };
		const userdataCheck = await checkParsing(LoginInputSchema, request.body);
		if (isParsingError(userdataCheck))
			return reply.status(400).send(userdataCheck);
		const data = userdataCheck as LoginInput;

        const checkUser: User2FA = await getUser2FA(data.email);
	
        if (!checkUser)
            return (reply.status(400).send({ message: "email doesn't exist" }));
		if (method === DB_CONST.USER.ACTIVE_2FA.EMAIL_CODE)
		{
			if (!checkUser.code2FaEmail)
				return (reply.status(400).send({ message: "2FA option wrong" }));
			eraseCode2FA(checkUser.email);
			if (checkUser.code2FaExpireAt && checkUser.code2FaExpireAt < Date.now())
				return (reply.status(400).send({ message: "Timeout" }));
			if (data.password != checkUser.code2FaEmail)
				return (reply.status(400).send({ message: "Wrong code" }));
		}
		else //choix du qrcode
		{
			if (!checkUser.code2FaQrcode)
				return (reply.status(400).send({ message: "2FA option wrong" }));
			// const check = speakeasy.totp.verify(checkUser.code2FaQrcode);
			const verified = speakeasy.totp.verify({
				secret: checkUser.code2FaQrcode,         // clé enregistrée en base
				encoding: 'base32',
				token: data.password,         // code entré par l'utilisateur
				window: 1                    // tolérance de décalage (en 30s)
			});
			if (verified === false)
				return (reply.status(400).send({ message: "Wrong code" }));
		}
		const user: UserModel | null = await getUser(null, data.email);
		if (!user) {
			return reply.status(500).send({
				statusCode: 500,
				errorMessage: 'Impossible de récupérer l’utilisateur après authentification'
			});
		}
        await ProcessAuth(app, checkUser, reply);
        return reply.status(200).send({
            statusCode: 200,
            message: 'Successfully logged in.',
            user: user
        });
    });


	/* -------------------------------------------------------------------------- */
	/*                                 🔒 LOGOUT                                  */
	/* -------------------------------------------------------------------------- */

	app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
		const jwtUser = request.user as JwtPayload;
		clearAuthCookies(reply);
		await setOnlineStatus(app, jwtUser.id, USER_ONLINE_STATUS.OFFLINE);
		return reply.status(200).send({
			statusCode: 200,
			message: 'Déconnecté'
		});
	});


	/* -------------------------------------------------------------------------- */
	/*                                 🅶 GOOGLE                                  */
	/* -------------------------------------------------------------------------- */

	app.post('/google', async (request: FastifyRequest, reply: FastifyReply) => {
		const { id_token } = request.body as { id_token: string };
		if (!id_token) {
			return reply.status(400).send({ errorMessage: 'Token Google manquant' });
		}

		try {
			// Vérification rapide du token Google (signature, audience, expiration)
			const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
			if (!verifyRes.ok) {
				return reply.status(401).send({ errorMessage: 'Token Google invalide' });
			}
			const payload = await verifyRes.json() as {
				email: string;
				aud: string;
			};

			if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
				return reply.status(401).send({ errorMessage: 'Token Google non destiné à cette application' });
			}

			// Décodage du JWT Google (pour extraire given_name, picture, etc.)
			const parts = id_token.split('.');
			if (parts.length !== 3) {
				return reply.status(400).send({ errorMessage: 'Format de token invalide' });
			}

			const payloadDecoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as GoogleUserInfo;

			const email = payloadDecoded.email;
			const username = payloadDecoded.givenName ?? payloadDecoded.name?.split(' ')[0] ?? 'GoogleUser';
			const avatar = payloadDecoded.picture ?? DB_CONST.USER.DEFAULT_AVATAR;
			
			let user = await getUserP(email);
			if (user && user.password) {
				return reply.status(403).send({ errorMessage: 'Account already registered with a local password.' });
			}
			
			if (!user) {
				await insertUser({ email, username }, true);
				user = await getUserP(email);
				if (!user) {
					return reply.status(500).send({ errorMessage: 'An error occurred while creating your Google account.' });
				}
			}
			
			// recuperation de l avatar google
			const avatarUrl = payloadDecoded.picture ?? DB_CONST.USER.DEFAULT_AVATAR;
			if (avatarUrl != DB_CONST.USER.DEFAULT_AVATAR){
				const response = await fetch(avatarUrl);

				if (user.avatar != DB_CONST.USER.DEFAULT_AVATAR) //pour supprimer l ancien avatar s'il n est pas celui par defaut
				{
					try {await fs.unlink(`./uploads/avatars/${user.avatar}`);}
					catch (err) { console.error(`Erreur lors de la suppression du fichier :`, err);}
				}

				// processus pour telecharger l avatar de google et le stocker dans la db
				const nodeStream = Readable.fromWeb(response.body as any); 
				const avatarBuffer = await bufferizeStream(nodeStream);
				const ext = response.headers.get('content-type') || 'image/jpg';
				const result: AvatarResult = await GetAvatarFromBuffer(reply, user, ext, avatarBuffer);
				if (result.success === false) {
					return reply.status(result.statusCode!).send({
						statusCode: result.statusCode,
						errorMessage: result.errorMessage || 'Erreur lors du telechargement de l’avatar',
					});
				}
			}

			// on valide l authentification + redonne les donnees user avec tout a jour
			await ProcessAuth(app, user, reply);
			const userData: UserModel = await getUser(null, email);
			return reply.status(200).send({
				statusCode: 200,
				message: 'Connexion Google réussie',
				user: userData
			});

		} catch (err) {
			console.error('Erreur Google Sign-In:', err);
			return reply.status(500).send({ errorMessage: 'Erreur serveur' });
		}
	});
}