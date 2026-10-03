import { error, redirect } from '@sveltejs/kit';
import { goto } from '$app/navigation';

/** @param {Response} res */
async function message(res) {
	const reply = await res.text();
	try {
		return JSON.parse(reply).message;
	} catch {
		return reply || res.statusText;
	}
}

/** For load functions: fetches JSON, sending the visitor to /login when locked. @param {typeof fetch} fetch @param {string} path */
export async function load(fetch, path) {
	const res = await fetch(path);
	if (res.status === 401) redirect(307, '/login');
	if (!res.ok) error(res.status, await message(res));
	return res.json();
}

/** For button handlers: sends JSON and returns the parsed reply, if any. @param {string} method @param {string} path @param {unknown} [data] */
export async function send(method, path, data) {
	const res = await fetch(path, {
		method,
		headers: data ? { 'content-type': 'application/json' } : undefined,
		body: data ? JSON.stringify(data) : undefined
	});
	if (res.status === 401) {
		await goto('/login');
		throw new Error('Passcode required');
	}
	if (!res.ok) throw new Error(await message(res));
	return res.status === 204 ? null : res.json();
}
