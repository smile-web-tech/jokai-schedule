// Dates travel as local 'YYYY-MM-DD' strings, so they compare with < and never drift across time zones.

const EPOCH = '2024-01-01'; // a Monday; rotation turns are counted from here
const DAY = 86_400_000;

/** @param {Date} d */
export function toISO(d) {
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${m}-${day}`;
}

/** @param {string} s */
export function parseISO(s) {
	const [y, m, d] = s.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export const today = () => toISO(new Date());

/** @param {string} s */
export const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());

/** @param {string} s @param {number} n */
export function addDays(s, n) {
	const d = parseISO(s);
	d.setDate(d.getDate() + n);
	return toISO(d);
}

/** First day of the month `n` months away from `s`. @param {string} s @param {number} n */
export function addMonths(s, n) {
	const d = parseISO(s);
	return toISO(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

/** 0 = Monday ... 6 = Sunday. @param {string} s */
export const weekday = (s) => (parseISO(s).getDay() + 6) % 7;

/** @param {string} s */
export const startOfWeek = (s) => addDays(s, -weekday(s));

/** @param {string} from @param {number} count */
export const range = (from, count) => Array.from({ length: count }, (_, i) => addDays(from, i));

/** The 7 days of the week containing `s`. @param {string} s */
export const weekDays = (s) => range(startOfWeek(s), 7);

/** Full Monday-to-Sunday weeks covering the month of `s`. @param {string} s */
export function monthGrid(s) {
	const first = addMonths(s, 0);
	const last = addDays(addMonths(s, 1), -1);
	const start = startOfWeek(first);
	const end = addDays(startOfWeek(last), 6);
	return range(start, Math.round((parseISO(end).getTime() - parseISO(start).getTime()) / DAY) + 1);
}

/** Weeks since EPOCH, used to pick whose turn it is. @param {string} s */
export const weekIndex = (s) =>
	Math.round((parseISO(startOfWeek(s)).getTime() - parseISO(EPOCH).getTime()) / (7 * DAY));

const fmt = (/** @type {Intl.DateTimeFormatOptions} */ o) => new Intl.DateTimeFormat('en-GB', o);
const short = fmt({ day: 'numeric', month: 'short' });
const long = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const month = fmt({ month: 'long', year: 'numeric' });

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** @param {string} s */
export const dayNumber = (s) => Number(s.slice(8));
/** @param {string} s */
export const longDate = (s) => long.format(parseISO(s));
/** @param {string} s */
export const monthLabel = (s) => month.format(parseISO(s));
/** @param {string} from @param {string} to */
export const weekLabel = (from, to) =>
	`${short.format(parseISO(from))} – ${short.format(parseISO(to))} ${to.slice(0, 4)}`;
