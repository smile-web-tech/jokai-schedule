import { load as get } from '$lib/api.js';
import { isISO, monthGrid, today, weekDays } from '$lib/dates.js';

export async function load({ url, fetch }) {
	const now = today();
	const view = url.searchParams.get('view') === 'month' ? 'month' : 'week';
	const param = url.searchParams.get('date') ?? '';
	const date = isISO(param) ? param : now;
	const days = view === 'week' ? weekDays(date) : monthGrid(date);
	const data = await get(fetch, `/api/data?from=${days[0]}&to=${days.at(-1)}`);
	return { ...data, view, date, days, today: now };
}
