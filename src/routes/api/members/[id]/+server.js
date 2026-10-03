import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { body, id, text } from '$lib/server/input.js';

export async function PATCH({ params, request }) {
	const b = await body(request);
	/** @type {Record<string, string>} */
	const fields = {};
	if ('name' in b) fields.name = text(b.name, 30);
	if ('color' in b) {
		if (!/^#[0-9a-f]{6}$/i.test(b.color)) error(400, 'Invalid color');
		fields.color = b.color;
	}
	if (!Object.keys(fields).length) error(400, 'Nothing to update');

	const sql = await db();
	const [row] = await sql`update members set ${sql(fields)} where id = ${id(params.id)} returning id`;
	if (!row) error(404, 'Not found');
	return new Response(null, { status: 204 });
}

export async function DELETE({ params }) {
	const sql = await db();
	await sql`delete from members where id = ${id(params.id)}`;
	return new Response(null, { status: 204 });
}
