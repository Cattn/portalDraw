<script lang="ts">
	import '../app.css';
	import '../main.css';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div class="h-screen pr-20">
	{@render children()}
	<Sidebar />
</div>