import { error } from '@sveltejs/kit';

/** @param {Request} request */
export async function body(request) {
	try {
		return await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
}

/** @param {unknown} value @param {number} max */
export function text(value, max) {
	const s = typeof value === 'string' ? value.trim() : '';
	if (!s || s.length > max) error(400, `Text must be 1-${max} characters`);
	return s;
}

/** @param {unknown} value @param {number} min @param {number} max */
export function int(value, min, max) {
	const n = Number(value);
	if (!Number.isInteger(n) || n < min || n > max) error(400, 'Invalid number');
	return n;
}

/** @param {unknown} value */
export function id(value) {
	return int(value, 1, 2 ** 31 - 1);
}

/** @param {unknown} value */
export function date(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) error(400, 'Invalid date');
	return value;
}

/** @param {unknown} value */
export function ids(value) {
	if (!Array.isArray(value)) error(400, 'Expected a list of ids');
	return value.map(id);
}
