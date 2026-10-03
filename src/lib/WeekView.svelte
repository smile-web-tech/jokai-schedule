<script>
	import { DAY_NAMES, dayNumber } from './dates.js';
	import { cellState, key, rotationLabel, scheduleLabel, weekRows } from './schedule.js';

	/**
	 * @type {{
	 *   data: { members: import('./schedule.js').Member[], activities: import('./schedule.js').Activity[], days: string[], today: string },
	 *   entries: import('./schedule.js').Entries,
	 *   who: number,
	 *   onpick: (target: import('./EntryDialog.svelte').Target) => void
	 * }}
	 */
	let { data, entries, who, onpick } = $props();

	/** @type {Record<string, string>} */
	const SYMBOL = { done: '✓', missed: '✗', auto: '✗' };
	/** @type {Record<string, string>} */
	const LABEL = {
		done: 'done',
		missed: 'not done',
		auto: 'not ticked, counted as not done',
		open: 'to do',
		free: 'optional'
	};

	const groups = $derived(
		data.activities
			.map((activity) => ({
				activity,
				rows: weekRows(activity, data.members, data.days, entries).filter(
					(r) => !who || r.member.id === who
				)
			}))
			.filter((g) => g.rows.length)
	);
</script>

{#if groups.length}
	<div class="card wrap">
		<table>
			<thead>
				<tr>
					<th class="name"></th>
					{#each data.days as d, i (d)}
						<th class:today={d === data.today}>
							<span>{DAY_NAMES[i]}</span>
							<b>{dayNumber(d)}</b>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each groups as { activity, rows } (activity.id)}
					<tr class="activity">
						<th colspan="8">
							{activity.name}
							<small>{scheduleLabel(activity)} · {rotationLabel(activity, data.members.length)}</small>
						</th>
					</tr>
					{#each rows as { member, duty } (member.id)}
						<tr>
							<th class="name"><i class="dot" style:background={member.color}></i>{member.name}</th>
							{#each data.days as d (d)}
								{@const entry = entries[key(d, activity.id, member.id)]}
								{@const state = cellState(activity, member, d, entry, duty, data.today)}
								<td class:today={d === data.today}>
									{#if state}
										<button
											class="cell {state}"
											aria-label="{member.name}, {activity.name}, {d}: {LABEL[state]}"
											onclick={() => onpick({ activity, member, date: d, entry, state })}
										>
											{SYMBOL[state] ?? ''}
											{#if entry?.note}<i class="note"></i>{/if}
										</button>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				{/each}
			</tbody>
		</table>
	</div>

	<p class="legend muted">
		<span><i class="cell done">✓</i> done</span>
		<span><i class="cell missed">✗</i> not done</span>
		<span><i class="cell auto">✗</i> not ticked</span>
		<span><i class="cell free"></i> anytime</span>
		<span><i class="cell open"><i class="note"></i></i> has note</span>
	</p>
{:else}
	<div class="card empty muted">Nothing to do this week.</div>
{/if}

<style>
	.wrap {
		padding: 4px 4px 8px;
		overflow-x: auto;
	}

	table {
		width: 100%;
		min-width: 320px;
		border-collapse: collapse;
		table-layout: fixed;
	}

	thead th {
		padding: 6px 0 4px;
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	thead b {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		margin: 2px auto 0;
		border-radius: 50%;
		font-size: 0.95rem;
		color: var(--text);
	}

	thead .today b {
		background: var(--accent);
		color: #fff;
	}

	.name {
		position: sticky;
		left: 0;
		z-index: 1;
		width: 84px;
		padding: 0 4px 0 6px;
		background: var(--surface);
		text-align: left;
		font-size: 0.85rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.name .dot {
		width: 8px;
		height: 8px;
		margin-right: 6px;
	}

	.activity th {
		padding: 14px 6px 4px;
		border-top: 1px solid var(--line);
		text-align: left;
		font-size: 0.95rem;
	}

	tbody tr.activity:first-child th {
		border-top: 0;
		padding-top: 6px;
	}

	.activity small {
		margin-left: 4px;
		font-size: 0.72rem;
		font-weight: 400;
		color: var(--muted);
	}

	td {
		height: 42px;
		padding: 3px 1px;
		text-align: center;
	}

	td.today {
		background: var(--today);
	}

	.cell {
		position: relative;
		display: inline-grid;
		place-items: center;
		width: 100%;
		max-width: 36px;
		min-height: 0;
		aspect-ratio: 1;
		padding: 0;
		border: 1.5px solid var(--line);
		border-radius: 50%;
		background: var(--surface);
		font-size: 1rem;
		font-weight: 700;
		font-style: normal;
		line-height: 1;
	}

	.cell.done {
		background: var(--done);
		border-color: var(--done);
		color: #fff;
	}

	.cell.missed {
		background: var(--miss);
		border-color: var(--miss);
		color: #fff;
	}

	.cell.auto {
		background: var(--miss-soft);
		border: 1.5px dashed var(--miss);
		color: var(--miss);
	}

	.cell.free {
		border: 2px dotted var(--line);
	}

	.note {
		position: absolute;
		top: -3px;
		right: -3px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--accent);
		border: 2px solid var(--surface);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 14px;
		margin: 10px 4px 0;
		font-size: 0.78rem;
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.legend .cell {
		width: 18px;
		font-size: 0.7rem;
		border-width: 1px;
	}

	.legend .note {
		width: 7px;
		height: 7px;
		border-width: 1px;
		top: -2px;
		right: -2px;
	}

	@media (min-width: 560px) {
		.name {
			width: 130px;
		}
	}
</style>
