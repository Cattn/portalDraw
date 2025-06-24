import { writable } from "svelte/store";

export const currentBoard = writable<string | null>(null);