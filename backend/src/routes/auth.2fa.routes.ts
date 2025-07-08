
const PORT = 3001;

async function doubleAuth(app: FastifyInstance) {
    app.post('/2FAsend', async (request: FastifyRequest, reply: FastifyReply) => {
        const user = await LoginInputSchema.safeParse(request.body);
        if (!user.success) {
            const error = user.error.errors[0];
            console.log(error);
            return reply.status(400).send({
                statusCode: 400,
                errorMessage: error.message + " in " + error.path
            });
        }
        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            const resInsert = await insertCode2FA(user.data.email, code);
            if (!resInsert) {
                return reply.status(500).send({
                    statusCode: 500,
                    errorMessage: 'Erreur lors de l’insertion du code 2FA'
                });
            }
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_2FA,
                    pass: process.env.PASS_EMAIL,
                },
            });

            await transporter.sendMail({
                from: '"Sécurité" <no-reply@transcendance.com>',
                to: user.data.email,
                subject: 'Votre code de vérification',
                text: `Votre code est : ${code}`,
            });
            return (reply.status(200).send({
                statusCode: 200,
                message: 'Code 2FA envoyé avec succès.'
            }));
        } catch (err) {
            console.log(err)
            request.log.error(err);
            return reply.status(500).send({
                statusCode: 500,
                errorMessage: 'Erreur serveur lors de l\'envoi 2FA'
            });
        }
    });

    app.post('/2FAreceive', async (request: FastifyRequest, reply: FastifyReply) => {
        const result = LoginInputSchema.safeParse(request.body); //c est le meme format que pour login input avec les memes checks
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
        eraseCode2FA(checkUser.email);
        if (checkUser.code_2FA_expire_at < Date.now())
            return (reply.status(400).send({ message: "Timeout" }));
        if (result.data.password != checkUser.code_2FA)
            return (reply.status(400).send({ message: "Wrong code" }));

        const user: UserModel | null = await getUser(null, result.data.email);
        if (!user) {
            return reply.status(500).send({
                statusCode: 500,
                errorMessage: 'Impossible de récupérer l’utilisateur après insertion'
            });
        }
        ProcessAuth(app, checkUser, reply);
        return reply.status(200).send({
            statusCode: 200,
            message: 'Successfully logged in.',
            user: user
        });
    });
}