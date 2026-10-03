import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { body, id, int, text } from '$lib/server/input.js';

export async function PATCH({ params, request }) {
	const b = await body(request);
	/** @type {Record<string, string | number>} */
	const fields = {};
	if ('name' in b) fields.name = text(b.name, 40);
	if ('schedule' in b) {
		if (b.schedule !== 'days' && b.schedule !== 'anytime') error(400, 'Invalid schedule');
		fields.schedule = b.schedule;
	}
	if ('days' in b) fields.days = int(b.days, 0, 127);
	if ('group_size' in b) fields.group_size = int(b.group_size, 0, 50);
	if ('rotate_weeks' in b) fields.rotate_weeks = int(b.rotate_weeks, 1, 12);
	if ('shift' in b) fields.shift = int(b.shift, -100000, 100000);
	if (!Object.keys(fields).length) error(400, 'Nothing to update');

	const sql = await db();
	const [row] = await sql`update activities set ${sql(fields)} where id = ${id(params.id)} returning id`;
	if (!row) error(404, 'Not found');
	return new Response(null, { status: 204 });
}

export async function DELETE({ params }) {
	const sql = await db();
	await sql`delete from activities where id = ${id(params.id)}`;
	return new Response(null, { status: 204 });
}
