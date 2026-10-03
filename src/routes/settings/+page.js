import { load as get } from '$lib/api.js';
import { today } from '$lib/dates.js';

export async function load({ fetch }) {
	return { ...(await get(fetch, '/api/data')), today: today() };
}
