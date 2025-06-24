<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { Card } from 'm3-svelte';
	import { scale, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let { visible = $bindable(false) } = $props();

	// Get shortcuts from settings
	const shortcuts = $derived(settingsStore.shortcuts);
	const shortcutsEnabled = $derived(settingsStore.accessibility.enableKeyboardShortcuts);

	function formatShortcut(shortcut: any) {
		const parts = [];
		if (shortcut.ctrl) parts.push('Ctrl');
		if (shortcut.alt) parts.push('Alt');
		if (shortcut.shift) parts.push('Shift');
		if (shortcut.meta) parts.push('Cmd');
		if (shortcut.key) parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
		return parts.join(' + ') || 'Not set';
	}

	function closeModal() {
		visible = false;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if visible}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		onclick={handleBackdropClick}
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
	>
		<!-- Modal -->
		<div 
			class="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
			in:scale={{ duration: 300, easing: quintOut }}
			out:scale={{ duration: 200, easing: quintOut }}
		>
			<Card variant="elevated" class="w-full h-full">
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="m3-font-headline-medium">Keyboard Shortcuts</h2>
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button 
						onclick={closeModal}
						class="p-2 rounded-full hover:bg-surface-container-high transition-colors"
						title="Close"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
							<path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6L17.6 19L12 13.4z"/>
						</svg>
					</button>
				</div>

				{#if !shortcutsEnabled}
					<div class="mb-6 p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
						<div class="flex items-start gap-3">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" class="text-orange-600 dark:text-orange-400 mt-0.5">
								<path fill="currentColor" d="M1 21h22L12 2L1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
							</svg>
							<div>
								<p class="font-medium text-orange-800 dark:text-orange-200">Keyboard shortcuts are disabled</p>
								<p class="text-sm text-orange-700 dark:text-orange-300 mt-1">
									Enable them in Settings → Accessibility to use these shortcuts.
								</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Drawing Tools -->
				<div class="mb-6">
					<h3 class="m3-font-title-large mb-3">Drawing Tools</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Pen Tool</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.tools.pen)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Highlighter Tool</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.tools.highlighter)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Eraser Tool</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.tools.eraser)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Hand Tool (Pan)</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.tools.hand)}
							</code>
						</div>
					</div>
				</div>

				<!-- Canvas Actions -->
				<div class="mb-6">
					<h3 class="m3-font-title-large mb-3">Canvas Actions</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Undo</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.canvas.undo)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Redo</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.canvas.redo)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Clear Canvas</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.canvas.clear)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Zoom In</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.canvas.zoomIn)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Zoom Out</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.canvas.zoomOut)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Reset Zoom</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.canvas.resetZoom)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Save Board</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.canvas.save)}
							</code>
						</div>
					</div>
				</div>

				<!-- UI Actions -->
				<div class="mb-6">
					<h3 class="m3-font-title-large mb-3">Interface</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Toggle Sidebar</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.ui.toggleSidebar)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Open Settings</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.ui.settings)}
							</code>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-on-surface">Toggle Fullscreen</span>
							<code class="px-2 py-1 bg-surface-container-high rounded text-sm font-mono">
								{formatShortcut(shortcuts.ui.fullscreen)}
							</code>
						</div>
					</div>
				</div>

				<div class="border-t border-surface-container-high pt-4">
					<p class="text-sm text-on-surface-variant">
						You can customize these shortcuts in Settings → Shortcuts.
						Shortcuts will not work when typing in text fields.
					</p>
				</div>
			</div>
			</Card>
		</div>
	</div>
{/if} 