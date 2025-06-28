import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fade, fly, slide, scale, blur } from 'svelte/transition';
import { flip } from 'svelte/animate';
import { quintOut, cubicOut } from 'svelte/easing';
import { settingsStore } from './stores/settings.svelte';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export const transitions = {
	get enabled() {
		return settingsStore.ui?.animateTransitions ?? true;
	},

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

	staggeredFly(
		index: number,
		options?: { baseDelay?: number; stagger?: number; y?: number; duration?: number }
	) {
		if (!this.enabled) return {};
		const baseDelay = options?.baseDelay ?? 0;
		const stagger = options?.stagger ?? 100;
		return {
			in: fly,
			params: {
				y: options?.y ?? 20,
				duration: options?.duration ?? 400,
				delay: baseDelay + index * stagger,
				easing: quintOut
			}
		};
	},

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

export const cssTransitions = {
	hover: 'transition-all duration-200 ease-out',

	button: 'transition-all duration-200 ease-out hover:scale-105 active:scale-95',

	card: 'transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-1',

	color: 'transition-colors duration-200 ease-out',

	transform: 'transition-transform duration-200 ease-out',

	opacity: 'transition-opacity duration-200 ease-out'
};

export const durations = {
	fast: 150,
	normal: 300,
	slow: 500,
	page: 200
} as const;

export const easings = {
	quintOut,
	cubicOut
} as const;
