/**
 * Thin module to get the current authenticated user ID
 * without importing the full Zustand store (avoids circular deps in db.ts).
 */

let _userId: string | null = null;

export function getSyncUser(): string | null {
  return _userId;
}

export function setSyncUser(id: string | null): void {
  _userId = id;
}
