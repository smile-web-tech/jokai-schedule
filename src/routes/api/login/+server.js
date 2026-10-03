import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { COOKIE, locked, token } from '$lib/server/auth.js';
import { body } from '$lib/server/input.js';

export async function POST({ request, cookies }) {
	const { passcode } = await body(request);
	if (locked()) {
		if (passcode !== env.FLAT_PASSCODE) error(401, 'Wrong passcode');
		cookies.set(COOKIE, await token(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365
		});
	}
	return new Response(null, { status: 204 });
}
