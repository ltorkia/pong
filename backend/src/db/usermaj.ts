import { getDb } from './index.db';

export async function insertAvatar(avatar: string, username: string)
{
       const db = await getDb();
       await db.run(`
               UPDATE User
               SET avatar = ?
               WHERE (username = ?)
               `,
       [avatar, username]);
}

export async function changePassword(username: string, password: string)
{
       const db = await getDb();
       await db.run(`
               UPDATE User
               SET password = ?
               WHERE (username = ?)
               `,
       [password, username]);
}

export async function changeUsername(usernameOrigin: string, usernameNew: string)
{
       const db = await getDb();
       await db.run(`
               UPDATE User
               SET username = ?
               WHERE (username = ?)
               `,
       [usernameNew, usernameOrigin]);
}

export async function changeEmail(username:string, email:string)
{
       const db = await getDb();
       await db.run(`
               UPDATE User
               SET username = ?
               WHERE (username = ?)
               `,
       [email, username]);
}

export async function insertCode2FA(email: string, code: string): Promise<{statusCode: number, message: string}>
{
	const db = await getDb();
	const end_time = Date.now() + 5 * 60 * 1000;
	console.log(code, end_time);
	await db.run(`
		UPDATE User
		SET code_2FA = ?, code_2FA_expire_at = ?
		WHERE (email = ?)
		`,
	[code, end_time , email]);
	return {statusCode : 201, message : 'code 2FA inserted'};
}

export async function eraseCode2FA(email: string)
{
	const db = await getDb();
	await db.run(`
		UPDATE User
		SET code_2FA = NULL, code_2FA_expire_at = NULL
		WHERE (email = ?)
		`,
	[email]);	
}

export async function majLastlog(username: string)
{
	const db = await getDb();
	await db.run(`
		UPDATE User
		SET begin_log = datetime('now')
		WHERE (username = ?)
		`,
	[username]);
}
