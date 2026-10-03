<script>
	import '../app.css';
	import { navigating } from '$app/state';

	let { children } = $props();
</script>

<main class:loading={navigating.to}>
	{@render children()}
</main>

<style>
	.loading {
		opacity: 0.6;
		transition: opacity 0.2s 0.15s;
	}
</style>
