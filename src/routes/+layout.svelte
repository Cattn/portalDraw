<script lang="ts">
	import '../app.css';
	import '../main.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { AppSettings } from '$lib/types';

	interface LayoutData {
		settings: AppSettings;
	}

	let { children, data }: { children: any; data: LayoutData } = $props();

	// Reactive variables for animation settings
	let animateTransitions = $derived(settingsStore.ui?.animateTransitions ?? true);

	// Initialize settings store with server-loaded data
	onMount(() => {
		if (data.settings) {
			// Initialize the store with server-loaded settings
			settingsStore.initializeSettings(data.settings);
		}
		
		// Apply initial theme
		applyTheme();
	});

	// Reactive effect to apply theme changes
	$effect(() => {
		if (settingsStore.ui) {
			applyTheme();
		}
	});

	function applyTheme() {
		if (typeof document !== 'undefined') {
			const htmlElement = document.documentElement;
			
			if (settingsStore.ui.darkMode) {
				htmlElement.classList.add('dark-mode');
				htmlElement.classList.remove('light-mode');
			} else {
				htmlElement.classList.add('light-mode');
				htmlElement.classList.remove('dark-mode');
			}
		}
	}
</script>

<div 
	class="h-screen pr-20"
	{...animateTransitions ? { in: fade, params: { duration: 400, easing: quintOut } } : {}}
>
	{@render children()}
	<Sidebar />
</div>