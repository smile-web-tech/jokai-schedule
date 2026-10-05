<script>
	import { DAY_NAMES, dayNumber } from './dates.js';
	import { cellState, key, weekRows } from './schedule.js';

	/**
	 * @type {{
	 *   members: import('./schedule.js').Member[], activities: import('./schedule.js').Activity[],
	 *   days: string[], month: string, today: string, entries: import('./schedule.js').Entries, who: number
	 * }}
	 */
	let { members, activities, days, month, today, entries, who } = $props();

	// One dot per task and day; rotation is worked out once per week
	const dots = $derived.by(() => {
		/** @type {Record<string, string[]>} */
		const out = {};
		for (let w = 0; w < days.length; w += 7) {
			const week = days.slice(w, w + 7);
			for (const a of activities) {
				const rows = weekRows(a, members, week, entries).filter((r) => !who || r.member.id === who);
				for (const d of week) {
					for (const { member, duty } of rows) {
						const state = cellState(a, member, d, entries[key(d, a.id, member.id)], duty, today);
						const dot =
							state === 'done' ? 'done'
							: state === 'missed' || state === 'auto' ? 'missed'
							: state === 'open' && duty ? 'open'
							: null;
						if (dot) (out[d] ??= []).push(dot);
					}
				}
			}
		}
		for (const list of Object.values(out)) list.sort();
		return out;
	});
</script>

<div class="card grid">
	{#each DAY_NAMES as name (name)}
		<div class="wd">{name}</div>
	{/each}
	{#each days as d (d)}
		<a href="?view=week&date={d}" class="day" class:out={!d.startsWith(month)} class:today={d === today}>
			<span class="num">{dayNumber(d)}</span>
			<span class="dots">
				{#each dots[d] ?? [] as dot, i (i)}<i class={dot}></i>{/each}
			</span>
		</a>
	{/each}
</div>

<p class="legend muted">
	<span><i class="done"></i> done</span>
	<span><i class="missed"></i> not done</span>
	<span><i class="open"></i> to do</span>
	<span>Tap a day to open its week.</span>
</p>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 3px;
		padding: 6px;
	}

	.wd {
		padding: 4px 0;
		text-align: center;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		color: var(--muted);
	}

	.day {
		transition:
			background-color 0.15s,
			transform 0.12s;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-height: 64px;
		padding: 5px 2px;
		border-radius: 8px;
	}

	.day:hover {
		background: var(--accent-soft);
	}

	.day:active {
		transform: scale(0.94);
	}

	.day.out {
		opacity: 0.4;
	}

	.day.today {
		background: var(--today);
	}

	.num {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.today .num {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		margin: -2px 0;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
	}

	.dots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 3px;
	}

	i {
		transition: background-color 0.2s;
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}

	.done {
		background: var(--done);
	}

	.missed {
		background: var(--miss);
	}

	.open {
		border: 1.5px solid var(--muted);
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

	@media (min-width: 560px) {
		.day {
			min-height: 84px;
		}

		i {
			width: 9px;
			height: 9px;
		}
	}
</style>
