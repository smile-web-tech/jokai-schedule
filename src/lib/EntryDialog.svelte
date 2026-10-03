<script module>
	/**
	 * @typedef {{ activity: import('./schedule.js').Activity, member: import('./schedule.js').Member,
	 *   date: string, entry?: import('./schedule.js').Entry, state: string }} Target
	 * @typedef {{ activity: import('./schedule.js').Activity, member: import('./schedule.js').Member,
	 *   date: string, status: 'done' | 'missed' | null, note: string }} Change
	 */
</script>

<script>
	import { longDate } from './dates.js';

	/** @type {{ target: Target | null, onsave: (change: Change) => void, onclose: () => void }} */
	let { target, onsave, onclose } = $props();

	/** @type {HTMLDialogElement} */
	let dialog;
	let note = $state('');

	$effect(() => {
		if (!target) return;
		note = target.entry?.note ?? '';
		dialog.showModal();
	});

	/** @param {'done' | 'missed' | null} status */
	function save(status) {
		if (!target) return;
		onsave({ activity: target.activity, member: target.member, date: target.date, status, note: note.trim() });
		dialog.close();
	}
</script>

<dialog bind:this={dialog} {onclose} onclick={(e) => e.target === dialog && dialog.close()}>
	{#if target}
		{@const status = target.entry?.status ?? null}
		<div class="sheet">
			<header>
				<div>
					<h3>{target.activity.name}</h3>
					<p class="muted">
						<i class="dot" style:background={target.member.color}></i>
						{target.member.name} · {longDate(target.date)}
					</p>
				</div>
				<button class="icon" onclick={() => dialog.close()} aria-label="Close">✕</button>
			</header>

			{#if target.state === 'auto'}
				<p class="warn">Not ticked in time, so it counts as not done.</p>
			{/if}

			<div class="choices">
				<button class="done" class:active={status === 'done'} onclick={() => save('done')}>✓ Done</button>
				<button class="missed" class:active={status === 'missed'} onclick={() => save('missed')}>✗ Not done</button>
			</div>

			<textarea bind:value={note} rows="3" maxlength="500" placeholder="Note (optional)"></textarea>

			<div class="actions">
				<button onclick={() => save(null)} disabled={!status}>Clear tick</button>
				<button class="primary" onclick={() => save(status)}>Save note</button>
			</div>
		</div>
	{/if}
</dialog>

<style>
	dialog {
		width: 100%;
		max-width: 100%;
		max-height: 100dvh;
		margin: auto 0 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--text);
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
	}

	.sheet {
		display: grid;
		gap: 12px;
		padding: 16px 16px max(16px, env(safe-area-inset-bottom));
		border-radius: 18px 18px 0 0;
		background: var(--surface);
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	h3 {
		font-size: 1.1rem;
	}

	header p {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 4px 0 0;
		font-size: 0.9rem;
	}

	.warn {
		margin: 0;
		padding: 8px 10px;
		border-radius: 8px;
		background: var(--miss-soft);
		color: var(--miss);
		font-size: 0.875rem;
	}

	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.choices button {
		min-height: 54px;
		font-size: 1rem;
		font-weight: 600;
	}

	.done {
		color: var(--done);
	}

	.missed {
		color: var(--miss);
	}

	.done.active {
		background: var(--done);
		border-color: var(--done);
		color: #fff;
	}

	.missed.active {
		background: var(--miss);
		border-color: var(--miss);
		color: #fff;
	}

	textarea {
		resize: vertical;
	}

	.actions {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}

	@media (min-width: 560px) {
		dialog {
			width: 420px;
			margin: auto;
		}

		.sheet {
			border-radius: 18px;
		}
	}
</style>
