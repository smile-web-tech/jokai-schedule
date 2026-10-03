<script>
	import { invalidateAll } from '$app/navigation';
	import { send } from '$lib/api.js';
	import { DAY_NAMES, addDays, today } from '$lib/dates.js';
	import { onDuty } from '$lib/schedule.js';

	let { data } = $props();

	let busy = $state(false);
	let newMember = $state('');
	let newActivity = $state('');

	/** Sends a change, then reloads the lists. @param {string} method @param {string} path @param {unknown} [body] */
	async function run(method, path, body) {
		busy = true;
		try {
			await send(method, path, body);
			await invalidateAll();
			return true;
		} catch (e) {
			alert(/** @type {Error} */ (e).message);
			return false;
		} finally {
			busy = false;
		}
	}

	/** @param {SubmitEvent} e @param {'members' | 'activities'} kind */
	async function add(e, kind) {
		e.preventDefault();
		const name = kind === 'members' ? newMember : newActivity;
		if (await run('POST', `/api/${kind}`, { name, today: today() })) {
			if (kind === 'members') newMember = '';
			else newActivity = '';
		}
	}

	/** @param {'members' | 'activities'} kind @param {{ id: number, name: string }} item @param {Record<string, unknown>} fields */
	const patch = (kind, item, fields) => run('PATCH', `/api/${kind}/${item.id}`, fields);

	/** @param {'members' | 'activities'} kind @param {{ id: number, name: string }} item @param {Event & { currentTarget: HTMLInputElement }} e */
	function rename(kind, item, e) {
		const name = e.currentTarget.value.trim();
		if (!name) e.currentTarget.value = item.name;
		else if (name !== item.name) patch(kind, item, { name });
	}

	/** @param {'members' | 'activities'} kind @param {{ id: number }[]} list @param {number} i @param {number} dir */
	function move(kind, list, i, dir) {
		const ids = list.map((x) => x.id);
		[ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
		run('PUT', `/api/${kind}`, { ids });
	}

	/** @param {'members' | 'activities'} kind @param {{ id: number, name: string }} item */
	function remove(kind, item) {
		if (confirm(`Delete "${item.name}"? All its ticks and notes are deleted too.`)) {
			run('DELETE', `/api/${kind}/${item.id}`);
		}
	}

	/** @param {{ name: string }[]} list */
	const names = (list) => list.map((m) => m.name).join(' & ');
</script>

<header class="bar">
	<a class="btn icon" href="/" aria-label="Back to schedule">‹</a>
	<h1>Settings</h1>
</header>

<section>
	<h2>Flatmates</h2>
	<div class="card">
		{#each data.members as m, i (m.id)}
			<div class="row">
				<input type="color" value={m.color} aria-label="Color for {m.name}"
					onchange={(e) => patch('members', m, { color: e.currentTarget.value })} />
				<input value={m.name} maxlength="30" aria-label="Name" onchange={(e) => rename('members', m, e)} />
				<button class="icon" aria-label="Move up" disabled={busy || i === 0}
					onclick={() => move('members', data.members, i, -1)}>↑</button>
				<button class="icon" aria-label="Move down" disabled={busy || i === data.members.length - 1}
					onclick={() => move('members', data.members, i, 1)}>↓</button>
				<button class="icon danger" aria-label="Delete {m.name}" disabled={busy}
					onclick={() => remove('members', m)}>✕</button>
			</div>
		{/each}
		<form class="row" onsubmit={(e) => add(e, 'members')}>
			<input bind:value={newMember} placeholder="Name" maxlength="30" required />
			<button class="primary" disabled={busy}>Add</button>
		</form>
	</div>
	<p class="hint muted">
		Order sets the rotation: with 2 people per turn, the 1st & 2nd share one week, the 3rd & 4th the next.
	</p>
</section>

<section>
	<h2>Chores</h2>
	{#each data.activities as a, i (a.id)}
		{@const people = data.members.length}
		{@const sizes = Array.from({ length: Math.max(people - 1, a.group_size) }, (_, k) => k + 1)}
		<div class="card chore">
			<div class="row">
				<input value={a.name} maxlength="40" aria-label="Chore name" onchange={(e) => rename('activities', a, e)} />
				<button class="icon" aria-label="Move up" disabled={busy || i === 0}
					onclick={() => move('activities', data.activities, i, -1)}>↑</button>
				<button class="icon" aria-label="Move down" disabled={busy || i === data.activities.length - 1}
					onclick={() => move('activities', data.activities, i, 1)}>↓</button>
				<button class="icon danger" aria-label="Delete {a.name}" disabled={busy}
					onclick={() => remove('activities', a)}>✕</button>
			</div>

			<div class="field">
				<span>When</span>
				<div class="seg">
					<button class:active={a.schedule === 'days'} disabled={busy}
						onclick={() => patch('activities', a, { schedule: 'days' })}>Set days</button>
					<button class:active={a.schedule === 'anytime'} disabled={busy}
						onclick={() => patch('activities', a, { schedule: 'anytime' })}>Anytime</button>
				</div>
			</div>

			{#if a.schedule === 'days'}
				<div class="days">
					{#each DAY_NAMES as name, d (name)}
						<button class="chip" class:on={a.days & (1 << d)} aria-pressed={(a.days & (1 << d)) !== 0}
							disabled={busy} onclick={() => patch('activities', a, { days: a.days ^ (1 << d) })}>{name}</button>
					{/each}
				</div>
				<p class="hint muted">Unticked set days count as not done once the day is over.</p>
			{:else}
				<p class="hint muted">Tick whenever it's done. Empty days are never counted as missed.</p>
			{/if}

			<div class="field">
				<span>Who</span>
				<select value={a.group_size} disabled={busy}
					onchange={(e) => patch('activities', a, { group_size: Number(e.currentTarget.value) })}>
					<option value={0}>Everyone</option>
					{#each sizes as k (k)}
						<option value={k}>{k} {k === 1 ? 'person' : 'people'} per turn</option>
					{/each}
				</select>
			</div>

			{#if a.group_size > 0 && a.group_size < people}
				<div class="field">
					<span>Turn</span>
					<select value={a.rotate_weeks} disabled={busy}
						onchange={(e) => patch('activities', a, { rotate_weeks: Number(e.currentTarget.value) })}>
						{#each [1, 2, 3, 4] as w (w)}
							<option value={w}>{w === 1 ? 'Changes every week' : `Changes every ${w} weeks`}</option>
						{/each}
					</select>
				</div>
				<div class="turns">
					<p>
						This week: <b>{names(onDuty(a, data.members, data.today))}</b><br />
						<span class="muted">Next week: {names(onDuty(a, data.members, addDays(data.today, 7)))}</span>
					</p>
					<button disabled={busy} onclick={() => patch('activities', a, { shift: a.shift + 1 })}>Next turn</button>
				</div>
			{/if}
		</div>
	{/each}

	<form class="card row" onsubmit={(e) => add(e, 'activities')}>
		<input bind:value={newActivity} placeholder="e.g. Clean toilet" maxlength="40" required />
		<button class="primary" disabled={busy}>Add</button>
	</form>
</section>

<style>
	section {
		margin-bottom: 24px;
	}

	h2 {
		margin: 0 4px 8px;
		font-size: 1rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.card > .row + .row {
		margin-top: 8px;
	}

	.row input:not([type='color']) {
		flex: 1;
		min-width: 0;
	}

	input[type='color'] {
		flex: none;
		width: 40px;
		height: 40px;
		padding: 2px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--bg);
	}

	.chore {
		display: grid;
		gap: 10px;
		margin-bottom: 10px;
	}

	.field {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.field > span {
		width: 44px;
		flex: none;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.field select {
		flex: 1;
	}

	.days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}

	.chip {
		min-height: 36px;
		padding: 0;
		font-size: 0.8rem;
	}

	.chip.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
		font-weight: 600;
	}

	.turns {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 10px;
		background: var(--accent-soft);
		font-size: 0.875rem;
	}

	.turns p {
		margin: 0;
	}

	.hint {
		margin: 6px 4px 0;
		font-size: 0.8rem;
	}

	.chore .hint {
		margin: -4px 0 0;
	}
</style>
