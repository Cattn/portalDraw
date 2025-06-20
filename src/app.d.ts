import type { Database } from 'sqlite3'

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: Database;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
