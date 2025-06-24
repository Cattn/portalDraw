<script lang="ts">
	import '../app.css';
	import '../main.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { keyboardShortcutService } from '$lib/services/keyboard-shortcuts';
	import { onMount, onDestroy } from 'svelte';
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
		
		// Apply initial theme and accessibility
		applyTheme();
		applyAccessibility();

		// Initialize keyboard shortcuts
		keyboardShortcutService.init();
	});

	// Cleanup on component destroy
	onDestroy(() => {
		keyboardShortcutService.destroy();
	});

	// Reactive effect to apply theme and accessibility changes
	$effect(() => {
		if (settingsStore.ui || settingsStore.accessibility) {
			applyTheme();
			applyAccessibility();
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

	function applyAccessibility() {
		if (typeof document !== 'undefined') {
			const htmlElement = document.documentElement;
			
			// High contrast mode
			if (settingsStore.accessibility.highContrast) {
				htmlElement.classList.add('high-contrast');
			} else {
				htmlElement.classList.remove('high-contrast');
			}
			
			// Increased font size
			if (settingsStore.accessibility.increaseFontSize) {
				htmlElement.classList.add('large-fonts');
			} else {
				htmlElement.classList.remove('large-fonts');
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