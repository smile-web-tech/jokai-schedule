import { DAY_NAMES, weekIndex, weekday } from './dates.js';

/**
 * @typedef {{ id: number, name: string, color: string, created_on: string }} Member
 * @typedef {{ id: number, name: string, schedule: 'days' | 'anytime', days: number, group_size: number,
 *   rotate_weeks: number, shift: number, created_on: string }} Activity
 * @typedef {{ date: string, activity_id: number, member_id: number, status: 'done' | 'missed' | null, note: string }} Entry
 * @typedef {Record<string, Entry>} Entries
 */

/** @param {string} date @param {number} activityId @param {number} memberId */
export const key = (date, activityId, memberId) => `${date}|${activityId}|${memberId}`;

/** @param {Entry[]} list */
export function indexEntries(list) {
	/** @type {Entries} */
	const map = {};
	for (const e of list) map[key(e.date, e.activity_id, e.member_id)] = e;
	return map;
}

/**
 * Members on duty for an activity in the week containing `date`.
 * With 4 people and 2 per turn: week 0 → 1st + 2nd, week 1 → 3rd + 4th, week 2 → 1st + 2nd ...
 * @param {Activity} activity @param {Member[]} members @param {string} date
 */
export function onDuty(activity, members, date) {
	const n = members.length;
	const k = activity.group_size;
	if (!k || k >= n) return members;
	const turn = Math.floor(weekIndex(date) / activity.rotate_weeks) + activity.shift;
	const picked = new Set();
	for (let i = 0; i < k; i++) picked.add((((turn * k + i) % n) + n) % n);
	return members.filter((_, i) => picked.has(i));
}

/** @param {Activity} activity @param {string} date */
export const isScheduled = (activity, date) =>
	activity.schedule === 'anytime' || (activity.days & (1 << weekday(date))) !== 0;

/**
 * Rows for one activity in one week: people on duty, plus anyone with entries
 * that week (so history stays visible after the rotation changes).
 * @param {Activity} activity @param {Member[]} members @param {string[]} days @param {Entries} entries
 */
export function weekRows(activity, members, days, entries) {
	const duty = new Set(onDuty(activity, members, days[0]).map((m) => m.id));
	return members
		.filter((m) => duty.has(m.id) || days.some((d) => entries[key(d, activity.id, m.id)]))
		.map((member) => ({ member, duty: duty.has(member.id) }));
}

/**
 * done | missed | auto (scheduled, past, never ticked) | open | free (anytime, optional) | null (not scheduled)
 * @param {Activity} activity @param {Member} member @param {string} date
 * @param {Entry | undefined} entry @param {boolean} duty @param {string} today
 */
export function cellState(activity, member, date, entry, duty, today) {
	if (entry?.status) return entry.status;
	if (!isScheduled(activity, date)) return entry ? 'open' : null;
	if (activity.schedule === 'anytime') return 'free';
	if (duty && date < today && date >= activity.created_on && date >= member.created_on) return 'auto';
	return 'open';
}

/** @param {Activity} a */
export function scheduleLabel(a) {
	if (a.schedule === 'anytime') return 'Anytime';
	if (a.days === 127) return 'Every day';
	if (!a.days) return 'No days picked';
	return DAY_NAMES.filter((_, i) => a.days & (1 << i)).join(', ');
}

/** @param {Activity} a @param {number} people */
export function rotationLabel(a, people) {
	if (!a.group_size || a.group_size >= people) return 'Everyone';
	const every = a.rotate_weeks > 1 ? `${a.rotate_weeks} weeks` : 'week';
	return `${a.group_size} ${a.group_size > 1 ? 'people' : 'person'} / ${every}`;
}
