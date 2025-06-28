<script lang="ts">
	import { Button, Card, Snackbar } from 'm3-svelte';
	import { goto } from '$app/navigation';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { fade, fly, slide, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut, cubicOut } from 'svelte/easing';

	let currentTab = $state('drawing');
	let fileInput = $state<HTMLInputElement>();

	let snackbar: ReturnType<typeof Snackbar>;

	function showNotification(message: string, isError = false) {
		if (snackbar) {
			snackbar.show({
				message,
				closable: true
			});
		}
	}

	const drawing = $derived(settingsStore.drawing);
	const ui = $derived(settingsStore.ui);
	const collaboration = $derived(settingsStore.collaboration);
	const account = $derived(settingsStore.account);
	const accessibility = $derived(settingsStore.accessibility);
	const shortcuts = $derived(settingsStore.shortcuts);

	let defaultBrushSize = $derived.by(() => drawing.defaultBrushSize);
	let defaultColor = $derived.by(() => drawing.defaultColor);
	let smoothStrokes = $derived.by(() => drawing.smoothStrokes);

	let darkMode = $derived.by(() => ui.darkMode);
	let animateTransitions = $derived.by(() => ui.animateTransitions);

	let showOtherCursors = $derived.by(() => collaboration.showOtherCursors);
	let enableNotifications = $derived.by(() => collaboration.enableNotifications);

	let profileColor = $derived.by(() => account.profileColor);

	let highContrast = $derived.by(() => accessibility.highContrast);
	let increaseFontSize = $derived.by(() => accessibility.increaseFontSize);
	let enableKeyboardShortcuts = $derived.by(() => accessibility.enableKeyboardShortcuts);

	const tabs = [
		{ id: 'drawing', label: 'Drawing' },
		{ id: 'ui', label: 'Interface' },
		{ id: 'collaboration', label: 'Collaboration' },
		{ id: 'account', label: 'Account' },
		{ id: 'accessibility', label: 'Accessibility' },
		{ id: 'shortcuts', label: 'Shortcuts' }
	];

	const tools = [
		{ value: 'pen' as const, label: 'Pen' },
		{ value: 'highlighter' as const, label: 'Highlighter' },
		{ value: 'eraser' as const, label: 'Eraser' }
	];

	async function saveSettings() {
		try {
			await settingsStore.updateSettings(settingsStore.settings);
			showNotification('Settings saved successfully!');
		} catch (error) {
			console.error('Failed to save settings:', error);
			showNotification('Failed to save settings. Please try again.', true);
		}
	}

	async function resetToDefaults() {
		if (confirm('Reset all settings to default values?')) {
			try {
				await settingsStore.resetToDefaults();
				showNotification('Settings reset to defaults successfully!');
			} catch (error) {
				console.error('Failed to reset settings:', error);
				showNotification('Failed to reset settings. Please try again.', true);
			}
		}
	}

	function exportSettings() {
		try {
			settingsStore.exportSettings();
			showNotification('Settings exported successfully!');
		} catch (error) {
			console.error('Failed to export settings:', error);
			showNotification('Failed to export settings. Please try again.', true);
		}
	}

	function importSettings() {
		fileInput?.click();
	}

	async function handleFileImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		if (!file.name.endsWith('.json')) {
			showNotification('Please select a valid JSON file.', true);
			return;
		}

		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const content = e.target?.result as string;
				const settings = JSON.parse(content);

				if (!settings || typeof settings !== 'object') {
					throw new Error('Invalid settings format');
				}

				await settingsStore.importSettings(settings);

				showNotification('Settings imported successfully!');
			} catch (error) {
				console.error('Failed to import settings:', error);
				showNotification(
					'Failed to import settings. Please check that the file is a valid PortalDraw settings file.',
					true
				);
			}
		};

		reader.onerror = () => {
			showNotification('Failed to read the file. Please try again.', true);
		};

		reader.readAsText(file);

		input.value = '';
	}

	async function updateDrawingSetting<K extends keyof typeof drawing>(
		key: K,
		value: (typeof drawing)[K]
	) {
		try {
			await settingsStore.updateSection('drawing', { [key]: value });
			showNotification('Drawing setting updated');
		} catch (error) {
			console.error('Failed to update drawing setting:', error);
			showNotification('Failed to update drawing setting', true);
		}
	}

	async function updateUISetting<K extends keyof typeof ui>(key: K, value: (typeof ui)[K]) {
		try {
			await settingsStore.updateSection('ui', { [key]: value });
			showNotification('UI setting updated');
		} catch (error) {
			console.error('Failed to update UI setting:', error);
			showNotification('Failed to update UI setting', true);
		}
	}

	async function updateCollaborationSetting<K extends keyof typeof collaboration>(
		key: K,
		value: (typeof collaboration)[K]
	) {
		try {
			await settingsStore.updateSection('collaboration', { [key]: value });
			showNotification('Collaboration setting updated');
		} catch (error) {
			console.error('Failed to update collaboration setting:', error);
			showNotification('Failed to update collaboration setting', true);
		}
	}

	async function updateAccountSetting<K extends keyof typeof account>(
		key: K,
		value: (typeof account)[K]
	) {
		try {
			await settingsStore.updateSection('account', { [key]: value });
			showNotification('Account setting updated');
		} catch (error) {
			console.error('Failed to update account setting:', error);
			showNotification('Failed to update account setting', true);
		}
	}

	async function updateAccessibilitySetting<K extends keyof typeof accessibility>(
		key: K,
		value: (typeof accessibility)[K]
	) {
		try {
			await settingsStore.updateSection('accessibility', { [key]: value });
			showNotification('Accessibility setting updated');
		} catch (error) {
			console.error('Failed to update accessibility setting:', error);
			showNotification('Failed to update accessibility setting', true);
		}
	}

	async function updateShortcutSetting<K extends keyof typeof shortcuts>(
		key: K,
		value: (typeof shortcuts)[K]
	) {
		try {
			await settingsStore.updateSection('shortcuts', { [key]: value });
			showNotification('Shortcut updated');
		} catch (error) {
			console.error('Failed to update shortcut setting:', error);
			showNotification('Failed to update shortcut setting', true);
		}
	}
	let capturingShortcut = $state<string | null>(null);
	let tempShortcut = $state({ key: '', ctrl: false, alt: false, shift: false, meta: false });

	function startShortcutCapture(shortcutId: string) {
		capturingShortcut = shortcutId;
		tempShortcut = { key: '', ctrl: false, alt: false, shift: false, meta: false };
	}

	function cancelShortcutCapture() {
		capturingShortcut = null;
		tempShortcut = { key: '', ctrl: false, alt: false, shift: false, meta: false };
	}

	function handleShortcutKeydown(event: KeyboardEvent) {
		if (!capturingShortcut) return;

		event.preventDefault();
		event.stopPropagation();

		if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
			return;
		}

		tempShortcut = {
			key: event.key,
			ctrl: event.ctrlKey,
			alt: event.altKey,
			shift: event.shiftKey,
			meta: event.metaKey
		};
	}

	async function applyShortcut() {
		if (!capturingShortcut || !tempShortcut.key) return;

		const [category, action] = capturingShortcut.split('.');
		const categoryKey = category as keyof typeof shortcuts;
		const actionKey = action as keyof (typeof shortcuts)[typeof categoryKey];

		const updatedCategory = {
			...shortcuts[categoryKey],
			[actionKey]: { ...tempShortcut }
		};

		await updateShortcutSetting(categoryKey, updatedCategory);
		capturingShortcut = null;
	}

	function formatShortcut(shortcut: any) {
		const parts = [];
		if (shortcut.ctrl) parts.push('Ctrl');
		if (shortcut.alt) parts.push('Alt');
		if (shortcut.shift) parts.push('Shift');
		if (shortcut.meta) parts.push('Cmd');
		if (shortcut.key) parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
		return parts.join(' + ') || 'Not set';
	}
</script>

<svelte:head>
	<title>Settings - PortalDraw</title>
</svelte:head>

<svelte:window onkeydown={handleShortcutKeydown} />

<div class="mx-auto max-w-4xl space-y-6 p-6">
	<div
		class="flex items-center justify-between"
		{...animateTransitions ? { in: fade, params: { duration: 500, delay: 100 } } : {}}
	>
		<div>
			<h1 class="m3-font-display-large">Settings</h1>
			<p class="m3-font-body-medium text-on-surface-variant mt-2">
				Customize your PortalDraw experience
			</p>
		</div>
		<Button variant="outlined" onclick={() => goto('/')}>Back to App</Button>
	</div>

	{#if settingsStore.isLocalMode}
		<Card
			variant="elevated"
			class="border-warning bg-warning-container border-l-4 p-4"
			{...animateTransitions
				? { in: fly, params: { y: 20, duration: 400, delay: 150, easing: quintOut } }
				: {}}
		>
			<div class="flex items-start gap-3">
				<div class="bg-warning mt-0.5 h-5 w-5 flex-shrink-0 rounded-full"></div>
				<div>
					<h3 class="m3-font-title-medium text-on-warning-container">Local Settings Mode</h3>
					<p class="m3-font-body-small text-on-warning-container mt-1">
						Global settings are disabled by server configuration. Your settings will be saved
						locally in your browser only and won't sync across devices.
					</p>
				</div>
			</div>
		</Card>
	{/if}

	<Card
		variant="elevated"
		class="p-4"
		{...animateTransitions
			? { in: fly, params: { y: 20, duration: 400, delay: 200, easing: quintOut } }
			: {}}
	>
		<div class="flex flex-wrap gap-2">
			{#each tabs as tab, index (tab.id)}
				<Button
					variant={currentTab === tab.id ? 'filled' : 'outlined'}
					onclick={() => (currentTab = tab.id)}
				>
					{tab.label}
				</Button>
			{/each}
		</div>
	</Card>

	{#if currentTab === 'drawing'}
		<div
			class="space-y-4"
			{...animateTransitions ? { in: slide, params: { duration: 300, easing: cubicOut } } : {}}
		>
			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 100, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Default Drawing Tools</h2>

				<div class="space-y-4">
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="m3-font-body-medium mb-2 block">Default Tool</label>
						<div class="flex gap-2">
							{#each tools as tool}
								<Button
									variant={drawing.defaultTool === tool.value ? 'filled' : 'outlined'}
									onclick={() => updateDrawingSetting('defaultTool', tool.value)}
								>
									{tool.label}
								</Button>
							{/each}
						</div>
					</div>

					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="m3-font-body-medium mb-2 block"
							>Default Brush Size: {drawing.defaultBrushSize}px</label
						>
						<input
							type="range"
							min="1"
							max="32"
							value={drawing.defaultBrushSize}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								updateDrawingSetting('defaultBrushSize', parseInt(target.value));
							}}
							class="range-input"
						/>
					</div>

					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="m3-font-body-medium mb-2 block">Default Color</label>
						<input
							type="color"
							value={drawing.defaultColor}
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								updateDrawingSetting('defaultColor', target.value);
							}}
							class="border-outline h-10 w-16 cursor-pointer rounded border-2"
						/>
					</div>
				</div>
			</Card>

			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 200, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Drawing Behavior</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Smooth Strokes</p>
							<p class="m3-font-body-small text-on-surface-variant">
								Apply smoothing to drawn lines
							</p>
						</div>
						<label class="flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={drawing.smoothStrokes}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateDrawingSetting('smoothStrokes', target.checked);
								}}
								class="sr-only"
							/>
							<div class={`toggle-switch ${drawing.smoothStrokes ? 'checked' : ''}`}>
								<div class={`toggle-knob ${drawing.smoothStrokes ? 'checked' : ''}`}></div>
							</div>
						</label>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if currentTab === 'ui'}
		<div
			class="space-y-4"
			{...animateTransitions ? { in: slide, params: { duration: 300, easing: cubicOut } } : {}}
		>
			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 100, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Appearance</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Dark Mode</p>
							<p class="m3-font-body-small text-on-surface-variant">Use dark color scheme</p>
						</div>
						<label class="flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={ui.darkMode}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateUISetting('darkMode', target.checked);
								}}
								class="sr-only"
							/>
							<div class={`toggle-switch ${ui.darkMode ? 'checked' : ''}`}>
								<div class={`toggle-knob ${ui.darkMode ? 'checked' : ''}`}></div>
							</div>
						</label>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Animate Transitions</p>
							<p class="m3-font-body-small text-on-surface-variant">
								Enable UI animations and transitions
							</p>
						</div>
						<label class="flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={ui.animateTransitions}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateUISetting('animateTransitions', target.checked);
								}}
								class="sr-only"
							/>
							<div class={`toggle-switch ${ui.animateTransitions ? 'checked' : ''}`}>
								<div class={`toggle-knob ${ui.animateTransitions ? 'checked' : ''}`}></div>
							</div>
						</label>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if currentTab === 'collaboration'}
		<div
			class="space-y-4"
			{...animateTransitions ? { in: slide, params: { duration: 300, easing: cubicOut } } : {}}
		>
			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 100, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Multiplayer Experience</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Show Other Cursors</p>
							<p class="m3-font-body-small text-on-surface-variant">
								Display cursors of other users
							</p>
						</div>
						<label class="flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={collaboration.showOtherCursors}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateCollaborationSetting('showOtherCursors', target.checked);
								}}
								class="sr-only"
							/>
							<div class={`toggle-switch ${collaboration.showOtherCursors ? 'checked' : ''}`}>
								<div class={`toggle-knob ${collaboration.showOtherCursors ? 'checked' : ''}`}></div>
							</div>
						</label>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Enable Notifications</p>
							<p class="m3-font-body-small text-on-surface-variant">
								Get notified when users join/leave
							</p>
						</div>
						<label class="flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={collaboration.enableNotifications}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateCollaborationSetting('enableNotifications', target.checked);
								}}
								class="sr-only"
							/>
							<div class={`toggle-switch ${collaboration.enableNotifications ? 'checked' : ''}`}>
								<div
									class={`toggle-knob ${collaboration.enableNotifications ? 'checked' : ''}`}
								></div>
							</div>
						</label>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if currentTab === 'account'}
		<div
			class="space-y-4"
			{...animateTransitions ? { in: slide, params: { duration: 300, easing: cubicOut } } : {}}
		>
			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 100, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Profile Information</h2>

				<div class="space-y-4">
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="m3-font-body-medium mb-2 block">Profile Color</label>
						<input
							type="color"
							value={account.profileColor}
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								updateAccountSetting('profileColor', target.value);
							}}
							class="border-outline h-10 w-16 cursor-pointer rounded border-2"
						/>
					</div>
				</div>
			</Card>

			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 200, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Data Management</h2>

				<div class="space-y-4">
					<Button variant="outlined" onclick={exportSettings}>Export Settings</Button>
					<Button variant="outlined" onclick={importSettings}>Import Settings</Button>
					<input
						bind:this={fileInput}
						type="file"
						accept=".json"
						onchange={handleFileImport}
						style="display: none;"
					/>
				</div>
			</Card>
		</div>
	{/if}

	{#if currentTab === 'accessibility'}
		<div
			class="space-y-4"
			{...animateTransitions ? { in: slide, params: { duration: 300, easing: cubicOut } } : {}}
		>
			<Card
				variant="elevated"
				class="border-l-4 border-l-yellow-500 bg-yellow-50 p-6 dark:bg-yellow-900/20"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 50, easing: quintOut } }
					: {}}
			>
				<div class="flex items-start gap-3">
					<div class="mt-1 flex-shrink-0">
						<iconify-icon
							icon="material-symbols:warning"
							class="text-xl text-yellow-600 dark:text-yellow-400"
						></iconify-icon>
					</div>
					<div>
						<h3 class="m3-font-title-medium mb-2 text-yellow-800 dark:text-yellow-200">
							Accessibility Notice
						</h3>
						<p class="m3-font-body-medium mb-2 text-yellow-700 dark:text-yellow-300">
							These accessibility features are designed for users with specific visual needs and may
							significantly alter the appearance and usability of the application.
						</p>
						<p class="m3-font-body-small text-yellow-600 dark:text-yellow-400">
							<strong>High Contrast</strong> and <strong>Large Fonts</strong> are intended for users
							with visual impairments. Most users should leave these settings disabled for the optimal
							experience.
						</p>
					</div>
				</div>
			</Card>

			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 100, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Visual Accessibility</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">High Contrast</p>
							<p class="m3-font-body-small text-on-surface-variant">
								Increase contrast for better visibility
							</p>
						</div>
						<label class="flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={accessibility.highContrast}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateAccessibilitySetting('highContrast', target.checked);
								}}
								class="sr-only"
							/>
							<div class={`toggle-switch ${accessibility.highContrast ? 'checked' : ''}`}>
								<div class={`toggle-knob ${accessibility.highContrast ? 'checked' : ''}`}></div>
							</div>
						</label>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Increase Font Size</p>
							<p class="m3-font-body-small text-on-surface-variant">
								Use larger text throughout the app
							</p>
						</div>
						<label class="flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={accessibility.increaseFontSize}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateAccessibilitySetting('increaseFontSize', target.checked);
								}}
								class="sr-only"
							/>
							<div class={`toggle-switch ${accessibility.increaseFontSize ? 'checked' : ''}`}>
								<div class={`toggle-knob ${accessibility.increaseFontSize ? 'checked' : ''}`}></div>
							</div>
						</label>
					</div>
				</div>
			</Card>

			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 200, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Input & Navigation</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Keyboard Shortcuts</p>
							<p class="m3-font-body-small text-on-surface-variant">
								Enable keyboard navigation and shortcuts
							</p>
						</div>
						<label class="flex cursor-pointer items-center">
							<input
								type="checkbox"
								checked={accessibility.enableKeyboardShortcuts}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateAccessibilitySetting('enableKeyboardShortcuts', target.checked);
								}}
								class="sr-only"
							/>
							<div
								class={`toggle-switch ${accessibility.enableKeyboardShortcuts ? 'checked' : ''}`}
							>
								<div
									class={`toggle-knob ${accessibility.enableKeyboardShortcuts ? 'checked' : ''}`}
								></div>
							</div>
						</label>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if currentTab === 'shortcuts'}
		<div
			class="space-y-4"
			{...animateTransitions ? { in: slide, params: { duration: 300, easing: cubicOut } } : {}}
		>
			<Card
				variant="elevated"
				class="border-l-4 border-l-blue-500 bg-blue-50 p-6 dark:bg-blue-900/20"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 50, easing: quintOut } }
					: {}}
			>
				<div class="flex items-start gap-3">
					<div class="mt-1 flex-shrink-0">
						<iconify-icon
							icon="material-symbols:keyboard"
							class="text-xl text-blue-600 dark:text-blue-400"
						></iconify-icon>
					</div>
					<div>
						<h3 class="m3-font-title-medium mb-2 text-blue-800 dark:text-blue-200">
							Keyboard Shortcuts
						</h3>
						<p class="m3-font-body-medium mb-2 text-blue-700 dark:text-blue-300">
							Customize keyboard shortcuts for tools and actions. Click on any shortcut to change
							it.
						</p>
						<p class="m3-font-body-small text-blue-600 dark:text-blue-400">
							Shortcuts will only work when the <strong>Enable Keyboard Shortcuts</strong> option is
							turned on in Accessibility settings.
						</p>
					</div>
				</div>
			</Card>

			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 100, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Drawing Tools</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Pen Tool</p>
							<p class="m3-font-body-small text-on-surface-variant">Switch to pen drawing tool</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'tools.pen'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('tools.pen')}>
								{capturingShortcut === 'tools.pen'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.tools.pen)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Highlighter Tool</p>
							<p class="m3-font-body-small text-on-surface-variant">Switch to highlighter tool</p>
						</div>
						<div
							class="shortcut-button"
							class:capturing={capturingShortcut === 'tools.highlighter'}
						>
							<Button variant="outlined" onclick={() => startShortcutCapture('tools.highlighter')}>
								{capturingShortcut === 'tools.highlighter'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.tools.highlighter)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Eraser Tool</p>
							<p class="m3-font-body-small text-on-surface-variant">Switch to eraser tool</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'tools.eraser'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('tools.eraser')}>
								{capturingShortcut === 'tools.eraser'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.tools.eraser)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Hand Tool</p>
							<p class="m3-font-body-small text-on-surface-variant">Switch to pan/hand tool</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'tools.hand'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('tools.hand')}>
								{capturingShortcut === 'tools.hand'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.tools.hand)}
							</Button>
						</div>
					</div>
				</div>
			</Card>

			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 200, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">Canvas Actions</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Undo</p>
							<p class="m3-font-body-small text-on-surface-variant">Undo last action</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'canvas.undo'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('canvas.undo')}>
								{capturingShortcut === 'canvas.undo'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.canvas.undo)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Redo</p>
							<p class="m3-font-body-small text-on-surface-variant">Redo last undone action</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'canvas.redo'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('canvas.redo')}>
								{capturingShortcut === 'canvas.redo'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.canvas.redo)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Clear Canvas</p>
							<p class="m3-font-body-small text-on-surface-variant">Clear all drawings</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'canvas.clear'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('canvas.clear')}>
								{capturingShortcut === 'canvas.clear'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.canvas.clear)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Zoom In</p>
							<p class="m3-font-body-small text-on-surface-variant">Zoom into the canvas</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'canvas.zoomIn'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('canvas.zoomIn')}>
								{capturingShortcut === 'canvas.zoomIn'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.canvas.zoomIn)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Zoom Out</p>
							<p class="m3-font-body-small text-on-surface-variant">Zoom out of the canvas</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'canvas.zoomOut'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('canvas.zoomOut')}>
								{capturingShortcut === 'canvas.zoomOut'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.canvas.zoomOut)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Reset Zoom</p>
							<p class="m3-font-body-small text-on-surface-variant">Reset zoom to 100%</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'canvas.resetZoom'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('canvas.resetZoom')}>
								{capturingShortcut === 'canvas.resetZoom'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.canvas.resetZoom)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Save</p>
							<p class="m3-font-body-small text-on-surface-variant">Save the current drawing</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'canvas.save'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('canvas.save')}>
								{capturingShortcut === 'canvas.save'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.canvas.save)}
							</Button>
						</div>
					</div>
				</div>
			</Card>

			<Card
				variant="elevated"
				class="p-6"
				{...animateTransitions
					? { in: fly, params: { y: 20, duration: 400, delay: 300, easing: quintOut } }
					: {}}
			>
				<h2 class="m3-font-headline-small mb-4">UI Actions</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Toggle Sidebar</p>
							<p class="m3-font-body-small text-on-surface-variant">Show/hide the sidebar</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'ui.toggleSidebar'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('ui.toggleSidebar')}>
								{capturingShortcut === 'ui.toggleSidebar'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.ui.toggleSidebar)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Open Settings</p>
							<p class="m3-font-body-small text-on-surface-variant">Open the settings page</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'ui.settings'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('ui.settings')}>
								{capturingShortcut === 'ui.settings'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.ui.settings)}
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Toggle Fullscreen</p>
							<p class="m3-font-body-small text-on-surface-variant">Enter/exit fullscreen mode</p>
						</div>
						<div class="shortcut-button" class:capturing={capturingShortcut === 'ui.fullscreen'}>
							<Button variant="outlined" onclick={() => startShortcutCapture('ui.fullscreen')}>
								{capturingShortcut === 'ui.fullscreen'
									? tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'Press keys...'
									: formatShortcut(shortcuts.ui.fullscreen)}
							</Button>
						</div>
					</div>
				</div>
			</Card>

			{#if capturingShortcut}
				<div class="card-container" in:scale={{ duration: 200 }}>
					<Card variant="elevated" class="border-primary bg-primary-container border-2 p-6">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="m3-font-title-medium">Recording Shortcut</h3>
								<p class="m3-font-body-small text-on-surface-variant">
									Press the keys you want to use. Current: {tempShortcut.key
										? formatShortcut(tempShortcut)
										: 'None'}
								</p>
							</div>
							<div class="flex gap-2">
								<Button variant="outlined" onclick={cancelShortcutCapture}>Cancel</Button>
								{#if tempShortcut.key}
									<Button variant="filled" onclick={applyShortcut}>Apply</Button>
								{/if}
							</div>
						</div>
					</Card>
				</div>
			{/if}
		</div>
	{/if}

	<div
		class="border-outline-variant flex justify-end gap-4 border-t pt-6"
		{...animateTransitions
			? { in: fly, params: { y: 20, duration: 400, delay: 300, easing: quintOut } }
			: {}}
	>
		<Button variant="outlined" onclick={resetToDefaults}>Reset to Defaults</Button>
		<Button variant="filled" onclick={saveSettings}>Save Settings</Button>
	</div>
</div>

<Snackbar bind:this={snackbar} />

<style>
	:global(.m3-container) {
		background: rgb(var(--m3-scheme-surface-container-lowest));
	}

	.toggle-switch {
		width: 3.5rem;
		height: 2rem;
		background-color: #374151;
		border-radius: 1rem;
		position: relative;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.toggle-switch.checked {
		background-color: #3b82f6;
	}

	.toggle-knob {
		width: 1.5rem;
		height: 1.5rem;
		background-color: white;
		border-radius: 50%;
		position: absolute;
		top: 0.25rem;
		left: 0.25rem;
		transition: transform 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.toggle-knob.checked {
		transform: translateX(1.5rem);
	}

	.range-input {
		width: 100%;
		height: 0.5rem;
		border-radius: 0.25rem;
		background: #d1d5db;
		outline: none;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.range-input:hover {
		opacity: 1;
	}

	.range-input::-webkit-slider-thumb {
		appearance: none;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
	}

	.range-input::-moz-range-thumb {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: none;
	}

	/* Shortcut button styling */
	.shortcut-button.capturing :global(button) {
		border: 2px solid rgb(var(--m3-scheme-primary));
		box-shadow: 0 0 0 2px rgba(var(--m3-scheme-primary), 0.2);
	}
</style>
