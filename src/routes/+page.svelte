<script>
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { send } from '$lib/api.js';
	import { addDays, addMonths, monthLabel, weekLabel } from '$lib/dates.js';
	import { indexEntries, key } from '$lib/schedule.js';
	import EntryDialog from '$lib/EntryDialog.svelte';
	import MonthView from '$lib/MonthView.svelte';
	import WeekView from '$lib/WeekView.svelte';

	let { data } = $props();

	// Overridden locally for instant feedback, recomputed whenever new data loads
	let entries = $derived(indexEntries(data.entries));
	let who = $state(stored());
	/** @type {import('$lib/EntryDialog.svelte').Target | null} */
	let target = $state(null);

	const person = $derived(data.members.some((m) => m.id === who) ? who : 0);
	const prev = $derived(data.view === 'week' ? addDays(data.date, -7) : addMonths(data.date, -1));
	const next = $derived(data.view === 'week' ? addDays(data.date, 7) : addMonths(data.date, 1));

	/** @param {string} view @param {string} [date] */
	const link = (view, date) => `?view=${view}${date ? `&date=${date}` : ''}`;

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

	// Pick up flatmates' changes when the app comes back to the foreground
	onMount(() => {
		const refresh = () => document.visibilityState === 'visible' && invalidateAll();
		document.addEventListener('visibilitychange', refresh);
		return () => document.removeEventListener('visibilitychange', refresh);
	});

	/** @param {import('$lib/EntryDialog.svelte').Change} change */
	async function save({ activity, member, date, status, note }) {
		const k = key(date, activity.id, member.id);
		const before = entries[k];
		const entry = { date, activity_id: activity.id, member_id: member.id, status, note };
		const { [k]: _, ...rest } = entries;
		entries = status || note ? { ...rest, [k]: entry } : rest;
		try {
			await send('POST', '/api/entries', entry);
		} catch (e) {
			entries = { ...entries, [k]: before };
			alert(`Could not save: ${/** @type {Error} */ (e).message}`);
		}
	}
</script>

<header class="bar">
	<h1>Jokai Schedule</h1>
	<a class="btn icon" href="/settings" aria-label="Settings">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
	</a>
</header>

<div class="toolbar">
	<nav class="seg" aria-label="View">
		<a href={link('week', data.date)} class:active={data.view === 'week'}>Week</a>
		<a href={link('month', data.date)} class:active={data.view === 'month'}>Month</a>
	</nav>
	<div class="pager">
		<a class="btn icon" href={link(data.view, prev)} aria-label="Previous">‹</a>
		<a class="btn" href={link(data.view)}>Today</a>
		<a class="btn icon" href={link(data.view, next)} aria-label="Next">›</a>
	</div>
</div>

<div class="period">
	<h2>{data.view === 'week' ? weekLabel(data.days[0], data.days[6]) : monthLabel(data.date)}</h2>
	{#if data.members.length > 1}
		<select bind:value={who} aria-label="Show">
			<option value={0}>Everyone</option>
			{#each data.members as m (m.id)}
				<option value={m.id}>{m.name}</option>
			{/each}
		</select>
	{/if}
</div>

{#if !data.members.length || !data.activities.length}
	<div class="card empty">
		<p>
			{data.members.length
				? 'Now add chores like cleaning, trash or laundry.'
				: 'Start by adding your flatmates and chores.'}
		</p>
		<a class="btn primary" href="/settings">Open settings</a>
	</div>
{:else if data.view === 'week'}
	<WeekView {data} {entries} who={person} onpick={(t) => (target = t)} />
{:else}
	<MonthView {data} {entries} who={person} />
{/if}

<EntryDialog {target} onsave={save} onclose={() => (target = null)} />

<style>
	.toolbar {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 12px;
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
</style>
