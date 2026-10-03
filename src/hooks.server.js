import { COOKIE, locked, token } from '$lib/server/auth.js';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const { pathname } = event.url;
	if (pathname.startsWith('/api/') && pathname !== '/api/login' && locked()) {
		if (event.cookies.get(COOKIE) !== (await token())) {
			return new Response('Passcode required', { status: 401 });
		}
	}
	return resolve(event);
}
