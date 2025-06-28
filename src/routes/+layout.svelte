<script lang="ts">
	import '$lib/polyfills';
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
		globalSettingsDisabled: boolean;
	}

	let { children, data }: { children: any; data: LayoutData } = $props();

	let animateTransitions = $derived(settingsStore.ui?.animateTransitions ?? true);

	onMount(() => {
		if (data.settings) {
			settingsStore.initializeSettings(data.settings);
		}

		if (data.globalSettingsDisabled !== undefined) {
			settingsStore.loadSettings();
		}

		applyTheme();
		applyAccessibility();

		keyboardShortcutService.init();
	});

	onDestroy(() => {
		keyboardShortcutService.destroy();
	});

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

			if (settingsStore.accessibility.highContrast) {
				htmlElement.classList.add('high-contrast');
			} else {
				htmlElement.classList.remove('high-contrast');
			}
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
