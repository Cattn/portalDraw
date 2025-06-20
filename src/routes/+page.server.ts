import type { PageServerLoad } from './$types';
import type { User } from "$lib/types.ts"

export const load: PageServerLoad = async ({ locals }) => {
  const loadDataPromise = new Promise<User[]>((resolve, reject) => {
    const db = locals.db;
    const query = "SELECT * FROM users";
    db.all<User>(query, (err: Error|null, rows: User[]) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(rows)
    })
  })
  const rows = await loadDataPromise;
  return {
    users: rows
  };
};