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
	import { ms } from './motion.js';

	/** @type {{ target: Target | null, onsave: (change: Change) => void, onclose: () => void }} */
	let { target, onsave, onclose } = $props();

	/** @type {HTMLDialogElement} */
	let dialog;
	let note = $state('');
	let closing = $state(false);

	$effect(() => {
		if (!target) return;
		note = target.entry?.note ?? '';
		dialog.showModal();
	});

	/** @param {'done' | 'missed' | null} status */
	function save(status) {
		if (!target) return;
		onsave({ activity: target.activity, member: target.member, date: target.date, status, note: note.trim() });
		close();
	}

	/** Plays the closing animation, then closes for real. */
	function close() {
		if (!dialog.open || closing) return;
		closing = true;
		setTimeout(() => {
			closing = false;
			dialog.close();
		}, ms(180));
	}
</script>

<dialog
	bind:this={dialog}
	class:closing
	{onclose}
	oncancel={(e) => {
		e.preventDefault();
		close();
	}}
	onclick={(e) => e.target === dialog && close()}
>
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
				<button class="icon" onclick={close} aria-label="Close">✕</button>
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

	dialog[open] {
		animation: sheet-in 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
	}

	dialog[open]::backdrop {
		animation: fade-in 0.25s ease-out;
	}

	dialog.closing {
		animation: sheet-out 0.18s ease-in forwards;
	}

	dialog.closing::backdrop {
		animation: fade-out 0.18s ease-in forwards;
	}

	@keyframes sheet-in {
		from {
			transform: translateY(100%);
		}
	}

	@keyframes sheet-out {
		to {
			transform: translateY(100%);
		}
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.96);
		}
	}

	@keyframes pop-out {
		to {
			opacity: 0;
			transform: translateY(10px) scale(0.96);
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
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

		dialog[open] {
			animation-name: pop-in;
		}

		dialog.closing {
			animation-name: pop-out;
		}

		.sheet {
			border-radius: 18px;
		}
	}
</style>
