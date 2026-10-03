<script>
	import { page } from '$app/state';
</script>

<div class="card empty">
	<h1>{page.status}</h1>
	<p class="muted">{page.error?.message}</p>
	<a class="btn" href="/">Back to schedule</a>
</div>
