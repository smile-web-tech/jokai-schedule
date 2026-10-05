// Last known API replies, kept in localStorage so the schedule shows instantly on open
// while fresh data loads in the background.

const STORAGE_KEY = 'jokai:cache';
const LIMIT = 8;

/** @type {Map<string, any> | undefined} */
let memory;

function all() {
	if (!memory) {
		try {
			memory = new Map(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
		} catch {
			memory = new Map();
		}
	}
	return memory;
}

/** @param {string} path */
export const cached = (path) => all().get(path);

/** @param {string} path @param {unknown} value */
export function remember(path, value) {
	const map = all();
	map.delete(path);
	map.set(path, value);
	while (map.size > LIMIT) map.delete(map.keys().next().value);
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...map]));
	} catch {}
}
