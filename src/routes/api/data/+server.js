import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { date } from '$lib/server/input.js';

/** Members and activities, plus entries between ?from and ?to when given — in one round trip. */
export async function GET({ url }) {
	const sql = await db();
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	const [data] = await sql`
		select
			(select coalesce(json_agg(json_build_object(
				'id', id, 'name', name, 'color', color, 'created_on', created_on::text
			) order by position, id), '[]') from members) as members,
			(select coalesce(json_agg(json_build_object(
				'id', id, 'name', name, 'schedule', schedule, 'days', days, 'group_size', group_size,
				'rotate_weeks', rotate_weeks, 'shift', shift, 'created_on', created_on::text
			) order by position, id), '[]') from activities) as activities,
			${
				from && to
					? sql`(select coalesce(json_agg(json_build_object(
						'date', date::text, 'activity_id', activity_id, 'member_id', member_id,
						'status', status, 'note', note
					)), '[]') from entries where date between ${date(from)} and ${date(to)})`
					: sql`'[]'::json`
			} as entries`;
	return json(data);
}
