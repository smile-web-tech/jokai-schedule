<script>
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	import { send } from '$lib/api.js';
	import { cached, remember } from '$lib/cache.js';
	import { addDays, addMonths, isISO, monthGrid, monthLabel, today, weekDays, weekLabel } from '$lib/dates.js';
	import { ms } from '$lib/motion.js';
	import { indexEntries, key } from '$lib/schedule.js';
	import EntryDialog from '$lib/EntryDialog.svelte';
	import MonthView from '$lib/MonthView.svelte';
	import WeekView from '$lib/WeekView.svelte';

	/**
	 * @typedef {{ members: import('$lib/schedule.js').Member[], activities: import('$lib/schedule.js').Activity[],
	 *   entries: import('$lib/schedule.js').Entry[] }} Data
	 */

	/** @param {string} view @param {string} date */
	function rangeOf(view, date) {
		return view === 'week' ? weekDays(date) : monthGrid(date);
	}

	/** @param {string[]} days */
	function apiPath(days) {
		return `/api/data?from=${days[0]}&to=${days.at(-1)}`;
	}

	/** @param {string} view @param {string} date @param {number} n */
	function step(view, date, n) {
		return view === 'week' ? addDays(date, 7 * n) : addMonths(date, n);
	}

	/** @param {string} view @param {string} [date] */
	function link(view, date) {
		return `?view=${view}${date ? `&date=${date}` : ''}`;
	}

	let now = $state(today());
	const view = $derived(page.url.searchParams.get('view') === 'month' ? 'month' : 'week');
	const date = $derived.by(() => {
		const param = page.url.searchParams.get('date') ?? '';
		return isISO(param) ? param : now;
	});
	const days = $derived(rangeOf(view, date));
	const path = $derived(apiPath(days));
	const prev = $derived(step(view, date, -1));
	const next = $derived(step(view, date, 1));

	/** @type {Data | null} */
	let shown = $state.raw(null);
	let loading = $state(false);
	let failure = $state('');
	let who = $state(stored());
	let dir = $state(0); // slide direction for the next period change
	let flash = $state(''); // cell that was just ticked, for its pop animation
	/** @type {import('$lib/EntryDialog.svelte').Target | null} */
	let target = $state(null);
	let edits = 0; // bumped on every local change, so slower reads started earlier can't undo it

	const entries = $derived(indexEntries(shown?.entries ?? []));
	const person = $derived(shown?.members.some((m) => m.id === who) ? who : 0);

	function stored() {
		try {
			return Number(localStorage.getItem('who')) || 0;
		} catch {
			return 0;
		}
	}

	$effect(() => {
		try {
			localStorage.setItem('who', String(who));
		} catch {}
	});

	/** Loads fresh data for `p`, keeping the cached copy on screen meanwhile. @param {string} p */
	async function refresh(p) {
		const start = edits;
		loading = true;
		try {
			/** @type {Data} */
			const fresh = await send('GET', p);
			if (start !== edits) return;
			remember(p, fresh);
			if (p === path) {
				shown = fresh;
				failure = '';
			}
		} catch (e) {
			if (p === path && !shown) failure = /** @type {Error} */ (e).message;
		} finally {
			if (p === path) loading = false;
		}
	}

	/** @param {string} p */
	function prefetch(p) {
		if (!cached(p)) send('GET', p).then((data) => remember(p, data), () => {});
	}

	$effect(() => {
		const p = path;
		shown = cached(p) ?? null;
		failure = '';
		refresh(p).then(() => {
			prefetch(apiPath(rangeOf(view, prev)));
			prefetch(apiPath(rangeOf(view, next)));
		});
	});

	// Pick up flatmates' changes (and a new day) when the app comes back to the foreground
	onMount(() => {
		const wake = () => {
			if (document.visibilityState !== 'visible') return;
			now = today();
			refresh(path);
		};
		document.addEventListener('visibilitychange', wake);
		return () => document.removeEventListener('visibilitychange', wake);
	});

	/** @param {import('$lib/EntryDialog.svelte').Change} change */
	async function save({ activity, member, date: day, status, note }) {
		if (!shown) return;
		const p = path;
		const before = shown;
		const entry = { date: day, activity_id: activity.id, member_id: member.id, status, note };
		const others = shown.entries.filter(
			(e) => !(e.date === day && e.activity_id === activity.id && e.member_id === member.id)
		);
		shown = { ...shown, entries: status || note ? [...others, entry] : others };
		edits++;

		const k = key(day, activity.id, member.id);
		flash = k;
		setTimeout(() => flash === k && (flash = ''), 600);

		try {
			await send('POST', '/api/entries', entry);
			if (p === path) remember(p, shown);
		} catch (e) {
			if (p === path) shown = before;
			alert(`Could not save: ${/** @type {Error} */ (e).message}`);
		}
	}
</script>

{#if loading}<div class="progress" aria-hidden="true"></div>{/if}

<header class="bar">
	<h1>Jokai Schedule</h1>
	<a class="btn icon" href="/settings" aria-label="Settings">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
	</a>
</header>

<div class="toolbar">
	<nav class="seg views" aria-label="View">
		<span class="pill" class:right={view === 'month'}></span>
		<a href={link('week', date)} class:active={view === 'week'} onclick={() => (dir = 0)}>Week</a>
		<a href={link('month', date)} class:active={view === 'month'} onclick={() => (dir = 0)}>Month</a>
	</nav>
	<div class="pager">
		<a class="btn icon" href={link(view, prev)} aria-label="Previous" onclick={() => (dir = -1)}>‹</a>
		<a class="btn" href={link(view)} onclick={() => (dir = date < now ? 1 : -1)}>Today</a>
		<a class="btn icon" href={link(view, next)} aria-label="Next" onclick={() => (dir = 1)}>›</a>
	</div>
</div>

<div class="period">
	<h2>{view === 'week' ? weekLabel(days[0], days[6]) : monthLabel(date)}</h2>
	{#if shown && shown.members.length > 1}
		<select bind:value={who} aria-label="Show">
			<option value={0}>Everyone</option>
			{#each shown.members as m (m.id)}
				<option value={m.id}>{m.name}</option>
			{/each}
		</select>
	{/if}
</div>

{#key view + days[0]}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div in:fly={{ x: dir * 28, y: dir ? 0 : 8, duration: ms(260), easing: cubicOut }} onclick={() => (dir = 0)}>
		{#if shown}
			{#if !shown.members.length || !shown.activities.length}
				<div class="card empty">
					<p>
						{shown.members.length
							? 'Now add chores like cleaning, trash or laundry.'
							: 'Start by adding your flatmates and chores.'}
					</p>
					<a class="btn primary" href="/settings">Open settings</a>
				</div>
			{:else if view === 'week'}
				<WeekView
					members={shown.members}
					activities={shown.activities}
					{days}
					today={now}
					{entries}
					who={person}
					{flash}
					onpick={(t) => (target = t)}
				/>
			{:else}
				<MonthView
					members={shown.members}
					activities={shown.activities}
					{days}
					month={date.slice(0, 7)}
					today={now}
					{entries}
					who={person}
				/>
			{/if}
		{:else if failure}
			<div class="card empty">
				<p>{failure}</p>
				<button onclick={() => refresh(path)}>Try again</button>
			</div>
		{:else}
			<div class="card skeleton" aria-label="Loading">
				{#each [1, 2, 3, 4, 5] as i (i)}<i></i>{/each}
			</div>
		{/if}
	</div>
{/key}

<EntryDialog {target} onsave={save} onclose={() => (target = null)} />

<style>
	.progress {
		position: fixed;
		inset: 0 0 auto;
		z-index: 10;
		height: 3px;
		overflow: hidden;
		opacity: 0;
		animation: appear 0.2s 0.25s forwards;
	}

	.progress::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 35%;
		border-radius: 3px;
		background: var(--accent);
		animation: travel 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@keyframes appear {
		to {
			opacity: 1;
		}
	}

	@keyframes travel {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(300%);
		}
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 12px;
	}

	.views {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.views > a {
		position: relative;
		justify-content: center;
		transition: color 0.2s;
	}

	.views > a.active {
		background: transparent;
		box-shadow: none;
	}

	.pill {
		position: absolute;
		top: 3px;
		bottom: 3px;
		left: 3px;
		width: calc(50% - 4px);
		min-height: 0;
		padding: 0;
		border-radius: 8px;
		background: var(--surface);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
		transition: transform 0.28s cubic-bezier(0.3, 0.9, 0.3, 1);
	}

	.pill.right {
		transform: translateX(calc(100% + 2px));
	}

	.pager {
		display: flex;
		gap: 4px;
	}

	.period {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 36px;
		margin-bottom: 10px;
	}

	.period h2 {
		font-size: 1.05rem;
	}

	.period select {
		width: auto;
		max-width: 45%;
		min-height: 36px;
		padding: 4px 8px;
	}

	.skeleton {
		display: grid;
		gap: 14px;
		padding: 18px 12px;
	}

	.skeleton i {
		height: 34px;
		border-radius: 8px;
		background: linear-gradient(90deg, var(--line) 30%, var(--bg) 50%, var(--line) 70%) 0 0 / 300% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	.skeleton i:nth-child(odd) {
		width: 60%;
		height: 18px;
	}

	@keyframes shimmer {
		from {
			background-position: 100% 0;
		}
		to {
			background-position: 0 0;
		}
	}
</style>
