import { getDb } from './index.db';
import { UserForChangeData } from '../types/user.types';
import { DB_CONST } from '../shared/config/constants.config';

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

// export async function changeUserData(id: number, username: string, password: string, email:string)
export async function changeUserData(id: number, user: UserForChangeData)

{
        const db = await getDb();
        // const user =
       await db.run(`
                UPDATE User
                SET username = ?, password = ?, email = ?, active_2FA = ?
                WHERE (id = ?)
               `,
       [user.username, user.password, user.email, user.active2Fa, user.id]);
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

export async function insertCode2FAEmail(email: string, code: string): Promise<{statusCode: number, message: string}>
{
	const db = await getDb();
	const end_time = Date.now() + 5 * 60 * 1000;
	await db.run(`
		UPDATE User
		SET code_2FA_email = ?, code_2FA_expire_at = ?
		WHERE (email = ?)
		`,
	[code, end_time , email]);
	return {statusCode : 201, message : 'code 2FA inserted'};
}

export async function insertCode2FAQrcode(email: string, code: string): Promise<{statusCode: number, message: string}>
{
	const db = await getDb();
	await db.run(`
		UPDATE User
		SET code_2FA_qrcode = ?
		WHERE (email = ?)
		`,
	[code, email]);
	return {statusCode : 201, message : 'code 2FA inserted'};
}

export async function eraseCode2FA(email: string)
{
	const db = await getDb();
	await db.run(`
		UPDATE User
		SET code_2FA_email = NULL, code_2FA_expire_at = NULL
		WHERE (email = ?)
		`,
	[email]);	
}

export async function majLastlog(username: string)
{
	const db = await getDb();
	await db.run(`
		UPDATE User
		SET begin_log = datetime('now'), status = ?
		WHERE (username = ?)
		`,
	[DB_CONST.USER.STATUS.ONLINE, username]);
}
