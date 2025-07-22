import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { RegisterInput, RegisterInputSchema, LoginInputSchema } from '../types/zod/auth.zod';
import { insertUser, getUser, getUserP, getUser2FA } from '../db/user';
import {eraseCode2FA} from '../db/usermaj';
import { ProcessAuth, clearAuthCookies,  GenerateEmailCode, GenerateQRCode  } from '../helpers/auth.helpers';
import { GetAvatarFromBuffer, bufferizeStream } from '../helpers/image.helpers';
import { GoogleUserInfo, UserPassword, User2FA, FastifyFileSizeError, AvatarResult } from '../types/user.types';
import { UserModel } from '../shared/types/user.types'; // en rouge car dossier local 'shared' != dossier conteneur
import { DB_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { Buffer } from 'buffer';
import nodemailer from 'nodemailer';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import * as speakeasy from 'speakeasy';

async function doubleAuth(app: FastifyInstance) {
    app.post('/2FAsend/:method', async (request: FastifyRequest, reply: FastifyReply) => {
		const { method } = request.params as { method: string };
		console.log("method = ", method);
        const userdata = await LoginInputSchema.safeParse(request.body); //a modifier en pram : request.body.user
        if (!userdata.success) {
            const error = userdata.error.errors[0];
            console.log(error);
            return reply.status(400).send({
                statusCode: 400,
                errorMessage: error.message + " in " + error.path
            });
        }
		const user = await getUser2FA(userdata.data.email);

        try {
			// console.log(request);
			if (method === 'email') //a changer apres avec = email
				return await GenerateEmailCode(reply, userdata.data.email);
			else if (method === 'qrcode' && !user.code2FaQrcode)
				return await GenerateQRCode(reply, userdata.data.email);

			return (reply.status(200).send({
				statusCode: 200,
				message: 'Code 2FA envoyé avec succès.'
			}));

        } catch (err) {
            console.log(err);
            request.log.error(err);
            return reply.status(500).send({
                statusCode: 500,
                errorMessage: 'Erreur serveur lors de l\'envoi 2FA'
            });
        }
    });

    app.post('/2FAreceive/:method', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = LoginInputSchema.safeParse(request.body); //c est le meme format que pour login input avec les memes checks
		const { method } = request.params as { method: string };
        if (!result.success) {
            const error = result.error.errors[0];
            return reply.status(400).send({
                statusCode: 400,
                errorMessage: error.message + " in " + error.path
            });
        }
        const checkUser: User2FA = await getUser2FA(result.data.email);
        if (!checkUser)
            return (reply.status(400).send({ message: "email doesn't exist" }));
		if (method === 'email')
		{
			if (!checkUser.code2FaEmail)
				return (reply.status(400).send({ message: "2FA option wrong" }));
			eraseCode2FA(checkUser.email);
			if (checkUser.code2FaExpireAt && checkUser.code2FaExpireAt < Date.now())
				return (reply.status(400).send({ message: "Timeout" }));
			if (result.data.password != checkUser.code2FaEmail)
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
				token: result.data.password,         // code entré par l'utilisateur
				window: 1                    // tolérance de décalage (en 30s)
			});
			if (verified === false)
				return (reply.status(400).send({ message: "Wrong code" }));
		}
		const user: UserModel | null = await getUser(null, result.data.email);
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
}

export async function authRoutes(app: FastifyInstance) {
	// REGISTER
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
				// console.log(element);
				if (element.type === 'file' && element.fieldname === 'avatar' && element.filename != '') {
					avatarFile = element;
					avatarBuffer = await bufferizeStream(element.file);
				} else if (element.type === 'field' && typeof element.value === 'string') {
					dataText[element.fieldname] = element.value;
				}
			}

			//check les datas texts pour voir si elles correspondent a ce qu on attend
			const result = RegisterInputSchema.safeParse(dataText);
			if (!result.success) {
				const error = result.error.errors[0];
				return reply.status(400).send({ statusCode: 400, errorMessage: error.message + " in " + error.path });
			}
			//on cree l user avec les donnees a inserer une fois le safeparse effectue
			let userToInsert = result.data as RegisterInput; //datatext
			//on hash le password dans un souci de confidentialite
			userToInsert.password = await bcrypt.hash(userToInsert.password, 10);

			const resultinsert = await insertUser(userToInsert, null);
			if (resultinsert.statusCode !== 201) {
				return reply.status(resultinsert.statusCode).send({
					statusCode: resultinsert.statusCode,
					errorMessage: resultinsert.message || 'Erreur lors de l’insertion de l’utilisateur',
				});
			}
			

			// SALUT !
			// Ai rajouté le retour de l'avatar en cas d'erreur ( const result: AvatarResult = await GetAvatarFromBuffer ),
			// parce que sans ça je récupère jamais les errorMessages de getAvatarFromBuffer, mais d'un autre
			// côté j'ai aussi vu que t'as rajouté des cas d'erreur dans ton catch donc je sais pas

			// Pour le 2FA (option sans 2FA quoi) j'ai rajouté vite fait les requêtes utilisateur pour pouvoir le stocker direct côté front
			// apres registration, mais comme tu peux le voir ça fait trois requêtes d'un coup :
			// faut récupérer le user apres l'insertion de l'avatar pour pouvoir check if (!user.active2Fa),
			// et une autre fois après ProcessAuth pour avoir le majLastLog à jour etc...
			// Y'a surement plus intuitif et plus propre, j'ai pas vraiment cherché plus loin je te laisse voir ça comme tu veux hihihiii

			// Ai aussi rajouté le await devant les ProcessAuth et GetAvatarFromBuffer parce que ça merdait dans mes tests
			// depuis ces dernières modifs. Valaaa c'est tout pour register O_O

			const userInfos: UserPassword = await getUserP(userToInsert.email);
			if (avatarFile && avatarBuffer) {
				// const result: AvatarResult = await GetAvatarFromBuffer(reply, userInfos, avatarFile, avatarBuffer);
				const result: AvatarResult = await GetAvatarFromBuffer(reply, userInfos, avatarFile.mimetype, avatarBuffer);
				if (result.success === false) {
					return reply.status(result.statusCode!).send({
						statusCode: result.statusCode,
						errorMessage: result.errorMessage || 'Erreur lors de l’insertion de l’avatar',
					});
				}
			}

			let user: UserModel = await getUser(null, userToInsert.email);
			// if (!user.active2Fa) {
				await ProcessAuth(app, userInfos, reply);
			// }
			user = await getUser(null, userToInsert.email);

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

	// LOGIN
	app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const result = LoginInputSchema.safeParse(request.body);

			if (!result.success) {
				const error = result.error.errors[0];
				return reply.status(400).send({
					statusCode: 400,
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

			if (validUser && validUser.registerFrom === DB_CONST.USER.REGISTER_FROM.GOOGLE) {
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

			const user: UserModel = await getUser(validUser.id);
			if (!user.active2Fa) {
				console.log(user, user.active2Fa);
				console.log("on process authhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
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
	doubleAuth(app); //si deja fait voir si on genere pas un cookie type pour pas avoir a le refaire une seconde fois quand on se log sur le mm ordi


	// LOGOUT
	app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
		clearAuthCookies(reply);
		return reply.status(200).send({
			statusCode: 200,
			message: 'Déconnecté'
		});
	});

	// GOOGLE
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
			
			const avatarUrl = payloadDecoded.picture ?? DB_CONST.USER.DEFAULT_AVATAR;
			if (avatarUrl != DB_CONST.USER.DEFAULT_AVATAR){
				const response = await fetch(avatarUrl);
				console.log(response);

				if (user.avatar != "default.png")
				{
					try {await fs.unlink(`./uploads/avatars/${user.avatar}`);}
					catch (err) { console.error(`Erreur lors de la suppression du fichier :`, err);} //ptet caca de faire comme ca jsp
				}
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