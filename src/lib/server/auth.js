import { env } from '$env/dynamic/private';

export const COOKIE = 'flat';

/** Cookie value for the current passcode; changing the passcode logs everyone out. */
export async function token() {
	const bytes = new TextEncoder().encode(`jokai-schedule:${env.FLAT_PASSCODE}`);
	const hash = await crypto.subtle.digest('SHA-256', bytes);
	return Buffer.from(hash).toString('hex');
}

export const locked = () => Boolean(env.FLAT_PASSCODE);
