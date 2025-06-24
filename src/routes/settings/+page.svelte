<script lang="ts">
	import { 
		Button, 
		Card,
		Snackbar
	} from 'm3-svelte';
	import { goto } from '$app/navigation';
	import { settingsStore } from '$lib/stores/settings.svelte';

	// Settings state
	let currentTab = $state('drawing');
	
	// File input for import
	let fileInput = $state<HTMLInputElement>();
	
	// Snackbar for notifications
	let snackbar: ReturnType<typeof Snackbar>;
	
	// Helper function to show snackbar notifications safely
	function showNotification(message: string, isError = false) {
		if (snackbar) {
			snackbar.show({ 
				message, 
				closable: true 
			});
		}
	}
	
	// Derived state for convenient access to settings
	const drawing = $derived(settingsStore.drawing);
	const ui = $derived(settingsStore.ui);
	const collaboration = $derived(settingsStore.collaboration);
	const account = $derived(settingsStore.account);
	const accessibility = $derived(settingsStore.accessibility);
	
	// Reactive variables bound to individual settings for two-way binding
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
		{ id: 'accessibility', label: 'Accessibility' }
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
		// Trigger file input click
		fileInput?.click();
	}
	
	async function handleFileImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		// Check file type
		if (!file.name.endsWith('.json')) {
			showNotification('Please select a valid JSON file.', true);
			return;
		}
		
		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const content = e.target?.result as string;
				const settings = JSON.parse(content);
				
				// Basic validation
				if (!settings || typeof settings !== 'object') {
					throw new Error('Invalid settings format');
				}
				
				// Import the settings through the store
				await settingsStore.importSettings(settings);
				
				showNotification('Settings imported successfully!');
			} catch (error) {
				console.error('Failed to import settings:', error);
				showNotification('Failed to import settings. Please check that the file is a valid PortalDraw settings file.', true);
			}
		};
		
		reader.onerror = () => {
			showNotification('Failed to read the file. Please try again.', true);
		};
		
		reader.readAsText(file);
		
		// Reset file input
		input.value = '';
	}

	// Helper functions for updating specific settings
	async function updateDrawingSetting<K extends keyof typeof drawing>(key: K, value: typeof drawing[K]) {
		try {
			await settingsStore.updateSection('drawing', { [key]: value });
			showNotification('Drawing setting updated');
		} catch (error) {
			console.error('Failed to update drawing setting:', error);
			showNotification('Failed to update drawing setting', true);
		}
	}

	async function updateUISetting<K extends keyof typeof ui>(key: K, value: typeof ui[K]) {
		try {
			await settingsStore.updateSection('ui', { [key]: value });
			showNotification('UI setting updated');
		} catch (error) {
			console.error('Failed to update UI setting:', error);
			showNotification('Failed to update UI setting', true);
		}
	}

	async function updateCollaborationSetting<K extends keyof typeof collaboration>(key: K, value: typeof collaboration[K]) {
		try {
			await settingsStore.updateSection('collaboration', { [key]: value });
			showNotification('Collaboration setting updated');
		} catch (error) {
			console.error('Failed to update collaboration setting:', error);
			showNotification('Failed to update collaboration setting', true);
		}
	}

	async function updateAccountSetting<K extends keyof typeof account>(key: K, value: typeof account[K]) {
		try {
			await settingsStore.updateSection('account', { [key]: value });
			showNotification('Account setting updated');
		} catch (error) {
			console.error('Failed to update account setting:', error);
			showNotification('Failed to update account setting', true);
		}
	}

	async function updateAccessibilitySetting<K extends keyof typeof accessibility>(key: K, value: typeof accessibility[K]) {
		try {
			await settingsStore.updateSection('accessibility', { [key]: value });
			showNotification('Accessibility setting updated');
		} catch (error) {
			console.error('Failed to update accessibility setting:', error);
			showNotification('Failed to update accessibility setting', true);
		}
	}
</script>

<svelte:head>
	<title>Settings - PortalDraw</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="m3-font-display-large">Settings</h1>
			<p class="m3-font-body-medium text-on-surface-variant mt-2">
				Customize your PortalDraw experience
			</p>
		</div>
		<Button variant="outlined" onclick={() => goto('/')}>
			Back to App
		</Button>
	</div>

	<!-- Navigation -->
	<Card variant="elevated" class="p-4">
		<div class="flex flex-wrap gap-2">
			{#each tabs as tab}
				<Button
					variant={currentTab === tab.id ? 'filled' : 'outlined'}
					onclick={() => currentTab = tab.id}
				>
					{tab.label}
				</Button>
			{/each}
		</div>
	</Card>

	<!-- Drawing Settings -->
	{#if currentTab === 'drawing'}
		<div class="space-y-4">
			<Card variant="elevated" class="p-6">
				<h2 class="m3-font-headline-small mb-4">Default Drawing Tools</h2>
				
				<div class="space-y-4">
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="m3-font-body-medium block mb-2">Default Tool</label>
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
						<label class="m3-font-body-medium block mb-2">Default Brush Size: {drawing.defaultBrushSize}px</label>
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
						<label class="m3-font-body-medium block mb-2">Default Color</label>
						<input 
							type="color" 
							value={drawing.defaultColor}
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								updateDrawingSetting('defaultColor', target.value);
							}}
							class="w-16 h-10 rounded border-2 border-outline cursor-pointer"
						/>
					</div>
				</div>
			</Card>

			<Card variant="elevated" class="p-6">
				<h2 class="m3-font-headline-small mb-4">Drawing Behavior</h2>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Smooth Strokes</p>
							<p class="m3-font-body-small text-on-surface-variant">Apply smoothing to drawn lines</p>
						</div>
						<label class="flex items-center cursor-pointer">
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

	<!-- UI Settings -->
	{#if currentTab === 'ui'}
		<div class="space-y-4">
			<Card variant="elevated" class="p-6">
				<h2 class="m3-font-headline-small mb-4">Appearance</h2>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Dark Mode</p>
							<p class="m3-font-body-small text-on-surface-variant">Use dark color scheme</p>
						</div>
						<label class="flex items-center cursor-pointer">
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
							<p class="m3-font-body-small text-on-surface-variant">Enable UI animations and transitions</p>
						</div>
						<label class="flex items-center cursor-pointer">
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

	<!-- Collaboration Settings -->
	{#if currentTab === 'collaboration'}
		<div class="space-y-4">
			<Card variant="elevated" class="p-6">
				<h2 class="m3-font-headline-small mb-4">Multiplayer Experience</h2>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Show Other Cursors</p>
							<p class="m3-font-body-small text-on-surface-variant">Display cursors of other users</p>
						</div>
						<label class="flex items-center cursor-pointer">
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
							<p class="m3-font-body-small text-on-surface-variant">Get notified when users join/leave</p>
						</div>
						<label class="flex items-center cursor-pointer">
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
								<div class={`toggle-knob ${collaboration.enableNotifications ? 'checked' : ''}`}></div>
							</div>
						</label>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	<!-- Account Settings -->
	{#if currentTab === 'account'}
		<div class="space-y-4">
			<Card variant="elevated" class="p-6">
				<h2 class="m3-font-headline-small mb-4">Profile Information</h2>
				
				<div class="space-y-4">
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="m3-font-body-medium block mb-2">Profile Color</label>
						<input 
							type="color" 
							value={account.profileColor}
							onchange={(e) => {
								const target = e.target as HTMLInputElement;
								updateAccountSetting('profileColor', target.value);
							}}
							class="w-16 h-10 rounded border-2 border-outline cursor-pointer"
						/>
					</div>
				</div>
			</Card>

			<Card variant="elevated" class="p-6">
				<h2 class="m3-font-headline-small mb-4">Data Management</h2>
				
				<div class="space-y-4">
					<Button variant="outlined" onclick={exportSettings}>
						Export Settings
					</Button>
					<Button variant="outlined" onclick={importSettings}>
						Import Settings
					</Button>
					<!-- Hidden file input for import -->
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

	<!-- Accessibility Settings -->
	{#if currentTab === 'accessibility'}
		<div class="space-y-4">
			<Card variant="elevated" class="p-6">
				<h2 class="m3-font-headline-small mb-4">Visual Accessibility</h2>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">High Contrast</p>
							<p class="m3-font-body-small text-on-surface-variant">Increase contrast for better visibility</p>
						</div>
						<label class="flex items-center cursor-pointer">
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
							<p class="m3-font-body-small text-on-surface-variant">Use larger text throughout the app</p>
						</div>
						<label class="flex items-center cursor-pointer">
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

			<Card variant="elevated" class="p-6">
				<h2 class="m3-font-headline-small mb-4">Input & Navigation</h2>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="m3-font-body-medium">Keyboard Shortcuts</p>
							<p class="m3-font-body-small text-on-surface-variant">Enable keyboard navigation and shortcuts</p>
						</div>
						<label class="flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={accessibility.enableKeyboardShortcuts}
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									updateAccessibilitySetting('enableKeyboardShortcuts', target.checked);
								}}
								class="sr-only"
							/>
							<div class={`toggle-switch ${accessibility.enableKeyboardShortcuts ? 'checked' : ''}`}>
								<div class={`toggle-knob ${accessibility.enableKeyboardShortcuts ? 'checked' : ''}`}></div>
							</div>
						</label>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	<!-- Action Buttons -->
	<div class="flex gap-4 justify-end pt-6 border-t border-outline-variant">
		<Button variant="outlined" onclick={resetToDefaults}>
			Reset to Defaults
		</Button>
		<Button variant="filled" onclick={saveSettings}>
			Save Settings
		</Button>
	</div>
</div>

<!-- Snackbar for notifications -->
<Snackbar bind:this={snackbar} />

<style>
	:global(.m3-container) {
		background: rgb(var(--m3-scheme-surface-container-lowest));
	}
	
	/* Custom toggle switch styling */
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
</style>
