import { settingsStore } from '$lib/stores/settings.svelte';
import { drawingStore } from '$lib/stores/drawing.svelte';
import { goto } from '$app/navigation';
import type { KeyboardShortcut } from '$lib/types';

class KeyboardShortcutService {
	private isActive = false;
	private listeners: (() => void)[] = [];

	init() {
		if (typeof window === 'undefined') return;

		this.isActive = true;
		this.addEventListeners();
	}

	destroy() {
		this.isActive = false;
		this.removeEventListeners();
	}

	private addEventListeners() {
		const handleKeydown = (event: KeyboardEvent) => {
			this.handleKeyboardEvent(event);
		};

		document.addEventListener('keydown', handleKeydown);
		this.listeners.push(() => document.removeEventListener('keydown', handleKeydown));
	}

	private removeEventListeners() {
		this.listeners.forEach((remove) => remove());
		this.listeners = [];
	}

	private handleKeyboardEvent(event: KeyboardEvent) {
		if (!settingsStore.accessibility.enableKeyboardShortcuts) return;
		if (this.isInputElement(event.target as Element)) return;

		const shortcuts = settingsStore.shortcuts;

		if (this.matchesShortcut(event, shortcuts.tools.pen)) {
			event.preventDefault();
			this.executeToolShortcut('pen');
		} else if (this.matchesShortcut(event, shortcuts.tools.highlighter)) {
			event.preventDefault();
			this.executeToolShortcut('highlighter');
		} else if (this.matchesShortcut(event, shortcuts.tools.eraser)) {
			event.preventDefault();
			this.executeToolShortcut('eraser');
		} else if (this.matchesShortcut(event, shortcuts.tools.hand)) {
			event.preventDefault();
			this.executeToolShortcut('hand');
		} else if (this.matchesShortcut(event, shortcuts.canvas.undo)) {
			event.preventDefault();
			this.executeCanvasAction('undo');
		} else if (this.matchesShortcut(event, shortcuts.canvas.redo)) {
			event.preventDefault();
			this.executeCanvasAction('redo');
		} else if (this.matchesShortcut(event, shortcuts.canvas.clear)) {
			event.preventDefault();
			this.executeCanvasAction('clear');
		} else if (this.matchesShortcut(event, shortcuts.canvas.zoomIn)) {
			event.preventDefault();
			this.executeCanvasAction('zoomIn');
		} else if (this.matchesShortcut(event, shortcuts.canvas.zoomOut)) {
			event.preventDefault();
			this.executeCanvasAction('zoomOut');
		} else if (this.matchesShortcut(event, shortcuts.canvas.resetZoom)) {
			event.preventDefault();
			this.executeCanvasAction('resetZoom');
		} else if (this.matchesShortcut(event, shortcuts.canvas.save)) {
			event.preventDefault();
			this.executeCanvasAction('save');
		} else if (this.matchesShortcut(event, shortcuts.ui.toggleSidebar)) {
			event.preventDefault();
			this.executeUIAction('toggleSidebar');
		} else if (this.matchesShortcut(event, shortcuts.ui.settings)) {
			event.preventDefault();
			this.executeUIAction('settings');
		} else if (this.matchesShortcut(event, shortcuts.ui.fullscreen)) {
			event.preventDefault();
			this.executeUIAction('fullscreen');
		}
	}

	private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
		const key = event.key === ' ' ? 'space' : event.key.toLowerCase();
		const shortcutKey = shortcut.key === ' ' ? 'space' : shortcut.key.toLowerCase();

		return (
			key === shortcutKey &&
			!!event.ctrlKey === !!shortcut.ctrl &&
			!!event.altKey === !!shortcut.alt &&
			!!event.shiftKey === !!shortcut.shift &&
			!!event.metaKey === !!shortcut.meta
		);
	}

	private isInputElement(element: Element | null): boolean {
		if (!element) return false;

		const tagName = element.tagName.toLowerCase();
		return (
			tagName === 'input' ||
			tagName === 'textarea' ||
			tagName === 'select' ||
			element.getAttribute('contenteditable') === 'true'
		);
	}

	private executeToolShortcut(tool: 'pen' | 'highlighter' | 'eraser' | 'hand') {
		console.log(`Keyboard shortcut: switching to ${tool} tool`);

		const settings = settingsStore.drawing;

		switch (tool) {
			case 'pen':
				drawingStore.setTool({
					type: 'pen',
					size: settings.defaultBrushSize,
					opacity: 1
				});
				break;
			case 'highlighter':
				drawingStore.setTool({
					type: 'highlighter',
					size: settings.defaultBrushSize,
					opacity: 0.5
				});
				break;
			case 'eraser':
				drawingStore.setTool({
					type: 'eraser',
					size: settings.defaultBrushSize,
					opacity: 1
				});
				break;
			case 'hand':
				drawingStore.setTool({
					type: 'hand',
					size: 1,
					opacity: 1
				});
				break;
		}
	}

	private executeCanvasAction(action: string) {
		console.log(`Keyboard shortcut: canvas action ${action}`);

		switch (action) {
			case 'undo':
				drawingStore.undo();
				break;
			case 'redo':
				drawingStore.redo();
				break;
			case 'clear':
				if (confirm('Clear the entire canvas? This action cannot be undone.')) {
					drawingStore.clear();
				}
				break;
			case 'zoomIn':
				const centerX = drawingStore.canvas?.width ? drawingStore.canvas.width / 2 : 400;
				const centerY = drawingStore.canvas?.height ? drawingStore.canvas.height / 2 : 300;
				drawingStore.zoomAt({ x: centerX, y: centerY }, 1.2);
				break;
			case 'zoomOut':
				const centerX2 = drawingStore.canvas?.width ? drawingStore.canvas.width / 2 : 400;
				const centerY2 = drawingStore.canvas?.height ? drawingStore.canvas.height / 2 : 300;
				drawingStore.zoomAt({ x: centerX2, y: centerY2 }, 0.8);
				break;
			case 'resetZoom':
				drawingStore.resetView();
				break;
			case 'save':
				this.triggerSave();
				break;
		}
	}

	private executeUIAction(action: string) {
		console.log(`Keyboard shortcut: UI action ${action}`);

		switch (action) {
			case 'toggleSidebar':
				window.dispatchEvent(new CustomEvent('toggle-sidebar'));
				break;
			case 'settings':
				goto('/settings');
				break;
			case 'fullscreen':
				this.toggleFullscreen();
				break;
		}
	}

	private toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.warn('Failed to enter fullscreen:', err);
			});
		} else {
			document.exitFullscreen().catch((err) => {
				console.warn('Failed to exit fullscreen:', err);
			});
		}
	}

	private triggerSave() {
		window.dispatchEvent(new CustomEvent('keyboard-save'));
	}
}

export const keyboardShortcutService = new KeyboardShortcutService();
