import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { date } from '$lib/server/input.js';

/** Members and activities, plus entries between ?from and ?to when given. */
export async function GET({ url }) {
	const sql = await db();
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	const [members, activities, entries] = await Promise.all([
		sql`select id, name, color, created_on::text from members order by position, id`,
		sql`select id, name, schedule, days, group_size, rotate_weeks, shift, created_on::text
			from activities order by position, id`,
		from && to
			? sql`select date::text, activity_id, member_id, status, note from entries
				where date between ${date(from)} and ${date(to)}`
			: []
	]);
	return json({ members, activities, entries });
}
