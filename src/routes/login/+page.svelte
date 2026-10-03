<script>
	import { goto } from '$app/navigation';

	let passcode = $state('');
	let wrong = $state(false);
	let busy = $state(false);

	/** @param {SubmitEvent} e */
	async function submit(e) {
		e.preventDefault();
		busy = true;
		const res = await fetch('/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ passcode })
		});
		busy = false;
		if (res.ok) {
			goto('/', { invalidateAll: true });
		} else {
			wrong = true;
			passcode = '';
		}
	}
</script>

<form class="card" onsubmit={submit}>
	<h1>Jokai Schedule</h1>
	<p class="muted">Enter the flat passcode.</p>
	<input type="password" bind:value={passcode} autocomplete="current-password" aria-label="Passcode" required />
	{#if wrong}<p class="wrong">Wrong passcode, try again.</p>{/if}
	<button class="primary" disabled={busy}>Enter</button>
</form>

<style>
	form {
		display: grid;
		gap: 12px;
		max-width: 360px;
		margin: 15vh auto 0;
		padding: 20px;
	}

	p {
		margin: 0;
	}

	.wrong {
		color: var(--miss);
		font-size: 0.875rem;
	}
</style>
