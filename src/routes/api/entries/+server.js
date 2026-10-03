import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { body, date, id } from '$lib/server/input.js';

/** Sets the status and note of one cell; an empty cell is deleted. */
export async function POST({ request }) {
	const b = await body(request);
	const day = date(b.date);
	const activity = id(b.activity_id);
	const member = id(b.member_id);
	const status = b.status ?? null;
	if (![null, 'done', 'missed'].includes(status)) error(400, 'Invalid status');
	const note = typeof b.note === 'string' ? b.note.trim().slice(0, 500) : '';

	const sql = await db();
	if (!status && !note) {
		await sql`delete from entries
			where activity_id = ${activity} and member_id = ${member} and date = ${day}`;
	} else {
		await sql`insert into entries (date, activity_id, member_id, status, note)
			values (${day}, ${activity}, ${member}, ${status}, ${note})
			on conflict (activity_id, member_id, date)
			do update set status = excluded.status, note = excluded.note`;
	}
	return new Response(null, { status: 204 });
}
