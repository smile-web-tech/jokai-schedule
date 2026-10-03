import { json } from '@sveltejs/kit';
import { db, reorder } from '$lib/server/db.js';
import { body, date, ids, text } from '$lib/server/input.js';

export async function POST({ request }) {
	const b = await body(request);
	const name = text(b.name, 40);
	const today = date(b.today);

	const sql = await db();
	const [row] = await sql`insert into activities (name, position, created_on)
		values (${name}, (select coalesce(max(position) + 1, 0) from activities), ${today})
		returning id`;
	return json(row, { status: 201 });
}

/** Saves a new order: { ids: [3, 1, 2] } */
export async function PUT({ request }) {
	await reorder('activities', ids((await body(request)).ids));
	return new Response(null, { status: 204 });
}
