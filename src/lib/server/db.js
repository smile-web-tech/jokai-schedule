import postgres from 'postgres';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const SCHEMA = `
create table if not exists members (
	id serial primary key,
	name text not null,
	color text not null,
	position int not null default 0,
	created_on date not null default current_date
);
create table if not exists activities (
	id serial primary key,
	name text not null,
	schedule text not null default 'anytime' check (schedule in ('days', 'anytime')),
	days int not null default 0,          -- bitmask: Mon = 1, Tue = 2 ... Sun = 64
	group_size int not null default 0,    -- people per turn, 0 = everyone
	rotate_weeks int not null default 1,  -- turn length in weeks
	shift int not null default 0,         -- moves the rotation forward
	position int not null default 0,
	created_on date not null default current_date
);
create table if not exists entries (
	date date not null,
	activity_id int not null references activities (id) on delete cascade,
	member_id int not null references members (id) on delete cascade,
	status text check (status in ('done', 'missed')),
	note text not null default '',
	primary key (activity_id, member_id, date)
);
create index if not exists entries_date on entries (date);
`;

/** @type {import('postgres').Sql | undefined} */
let sql;
/** @type {Promise<unknown> | undefined} */
let ready;

/** Returns the shared client, creating the tables on first use. */
export async function db() {
	if (!sql) {
		const url = env.DATABASE_URL || env.POSTGRES_URL;
		if (!url) error(500, 'DATABASE_URL is not set');
		// prepare: false keeps it compatible with pooled (pgbouncer) connection strings
		sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20, onnotice: () => {} });
		ready = sql.unsafe(SCHEMA).simple();
	}
	await ready;
	return sql;
}

/** @param {'members' | 'activities'} table @param {number[]} ids */
export async function reorder(table, ids) {
	const sql = await db();
	await sql.begin((tx) =>
		ids.map((id, position) => tx`update ${tx(table)} set position = ${position} where id = ${id}`)
	);
}
