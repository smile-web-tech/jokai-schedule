import { json } from '@sveltejs/kit';
import { db, reorder } from '$lib/server/db.js';
import { body, date, ids, text } from '$lib/server/input.js';

const PALETTE = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16'];

export async function POST({ request }) {
	const b = await body(request);
	const name = text(b.name, 30);
	const today = date(b.today);

	const sql = await db();
	const used = (await sql`select color from members`).map((r) => r.color);
	const color = PALETTE.find((c) => !used.includes(c)) ?? PALETTE[used.length % PALETTE.length];
	const [row] = await sql`insert into members (name, color, position, created_on)
		values (${name}, ${color}, (select coalesce(max(position) + 1, 0) from members), ${today})
		returning id`;
	return json(row, { status: 201 });
}

/** Saves a new order: { ids: [3, 1, 2] } */
export async function PUT({ request }) {
	await reorder('members', ids((await body(request)).ids));
	return new Response(null, { status: 204 });
}
