<script lang="ts">
	import '../app.css';
	import '../main.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { onMount } from 'svelte';
	import type { AppSettings } from '$lib/types';

	interface LayoutData {
		settings: AppSettings;
	}

	let { children, data }: { children: any; data: LayoutData } = $props();

	// Initialize settings store with server-loaded data
	onMount(() => {
		if (data.settings) {
			// Initialize the store with server-loaded settings
			settingsStore.initializeSettings(data.settings);
		}
	});
</script>

<div class="h-screen pr-20">
	{@render children()}
	<Sidebar />
</div>