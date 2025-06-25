import { writable } from "svelte/store";
import type { Board } from "$lib/types";

export const currentBoard = writable<Board | null>(null);