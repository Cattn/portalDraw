import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { fade, fly, slide, scale, blur } from 'svelte/transition';
import { flip } from 'svelte/animate';
import { quintOut, cubicOut } from 'svelte/easing';
import { settingsStore } from './stores/settings.svelte';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Transition utility functions that respect the user's animation preferences
 */

export const transitions = {
	/**
	 * Get transition parameters only if animations are enabled
	 */
	get enabled() {
		return settingsStore.ui?.animateTransitions ?? true;
	},

	/**
	 * Fade transition with default parameters
	 */
	fade(options?: { duration?: number; delay?: number }) {
		if (!this.enabled) return {};
		return {
			in: fade,
			params: {
				duration: options?.duration ?? 300,
				delay: options?.delay ?? 0,
				easing: quintOut
			}
		};
	},

	/**
	 * Fly transition with default parameters
	 */
	fly(options?: { x?: number; y?: number; duration?: number; delay?: number }) {
		if (!this.enabled) return {};
		return {
			in: fly,
			params: {
				x: options?.x ?? 0,
				y: options?.y ?? 20,
				duration: options?.duration ?? 400,
				delay: options?.delay ?? 0,
				easing: quintOut
			}
		};
	},

	/**
	 * Slide transition with default parameters
	 */
	slide(options?: { duration?: number; delay?: number }) {
		if (!this.enabled) return {};
		return {
			in: slide,
			params: {
				duration: options?.duration ?? 300,
				delay: options?.delay ?? 0,
				easing: cubicOut
			}
		};
	},

	/**
	 * Scale transition with default parameters
	 */
	scale(options?: { start?: number; duration?: number; delay?: number }) {
		if (!this.enabled) return {};
		return {
			in: scale,
			params: {
				start: options?.start ?? 0.9,
				duration: options?.duration ?? 300,
				delay: options?.delay ?? 0,
				easing: quintOut
			}
		};
	},

	/**
	 * Blur transition with default parameters
	 */
	blur(options?: { amount?: number; duration?: number; delay?: number }) {
		if (!this.enabled) return {};
		return {
			in: blur,
			params: {
				amount: options?.amount ?? 5,
				duration: options?.duration ?? 300,
				delay: options?.delay ?? 0,
				easing: quintOut
			}
		};
	},

	/**
	 * Flip animation for list items
	 */
	flip(options?: { duration?: number }) {
		if (!this.enabled) return {};
		return {
			animate: flip,
			params: {
				duration: options?.duration ?? 300,
				easing: quintOut
			}
		};
	},

	/**
	 * Staggered entrance animation for lists
	 */
	staggeredFly(index: number, options?: { baseDelay?: number; stagger?: number; y?: number; duration?: number }) {
		if (!this.enabled) return {};
		const baseDelay = options?.baseDelay ?? 0;
		const stagger = options?.stagger ?? 100;
		return {
			in: fly,
			params: {
				y: options?.y ?? 20,
				duration: options?.duration ?? 400,
				delay: baseDelay + (index * stagger),
				easing: quintOut
			}
		};
	},

	/**
	 * Page transition - useful for route changes
	 */
	pageTransition(options?: { duration?: number }) {
		if (!this.enabled) return {};
		return {
			in: fade,
			params: {
				duration: options?.duration ?? 200,
				easing: quintOut
			},
			out: fade,
			outparams: {
				duration: options?.duration ?? 200,
				easing: quintOut
			}
		};
	},

	/**
	 * Modal/overlay transitions
	 */
	modal() {
		if (!this.enabled) return {};
		return {
			in: scale,
			params: {
				start: 0.9,
				duration: 200,
				easing: quintOut
			},
			out: scale,
			outparams: {
				start: 0.9,
				duration: 150,
				easing: quintOut
			}
		};
	},

	/**
	 * Sidebar/drawer transitions
	 */
	drawer(direction: 'left' | 'right' | 'top' | 'bottom' = 'right') {
		if (!this.enabled) return {};
		const params = {
			duration: 300,
			easing: quintOut
		};
		
		switch (direction) {
			case 'left':
				return { in: fly, params: { ...params, x: -300 } };
			case 'right':
				return { in: fly, params: { ...params, x: 300 } };
			case 'top':
				return { in: fly, params: { ...params, y: -300 } };
			case 'bottom':
				return { in: fly, params: { ...params, y: 300 } };
		}
	}
};

/**
 * CSS transition classes for hover effects and micro-interactions
 */
export const cssTransitions = {
	/**
	 * Base hover transition
	 */
	hover: 'transition-all duration-200 ease-out',
	
	/**
	 * Button-like hover with scale
	 */
	button: 'transition-all duration-200 ease-out hover:scale-105 active:scale-95',
	
	/**
	 * Card hover effect
	 */
	card: 'transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-1',
	
	/**
	 * Color transitions
	 */
	color: 'transition-colors duration-200 ease-out',
	
	/**
	 * Transform transitions
	 */
	transform: 'transition-transform duration-200 ease-out',
	
	/**
	 * Opacity transitions
	 */
	opacity: 'transition-opacity duration-200 ease-out'
};

/**
 * Animation duration presets
 */
export const durations = {
	fast: 150,
	normal: 300,
	slow: 500,
	page: 200
} as const;

/**
 * Common easing functions
 */
export const easings = {
	quintOut,
	cubicOut
} as const;
