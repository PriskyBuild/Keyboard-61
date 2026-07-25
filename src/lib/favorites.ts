// MIT License — Piano Learning App
// Favorites system — lets users star songs to pin them to the top of the
// song selector. Persisted to localStorage.

const STORAGE_KEY = "piano-app:favorites:v1";

/** Load the set of favorited song IDs from localStorage. */
export function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/** Save the set of favorited song IDs to localStorage. */
export function saveFavorites(favorites: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Array.from(favorites)),
    );
  } catch {
    /* noop */
  }
}

/** Toggle a song in/out of the favorites set. Returns the new set. */
export function toggleFavorite(songId: string, current: Set<string>): Set<string> {
  const next = new Set(current);
  if (next.has(songId)) {
    next.delete(songId);
  } else {
    next.add(songId);
  }
  saveFavorites(next);
  return next;
}
