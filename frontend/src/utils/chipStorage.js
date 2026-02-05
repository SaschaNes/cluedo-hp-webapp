function chipStorageKey(gameId, entryId) {
    return `chip:${gameId}:${entryId}`;
  }

  export function getChipLS(gameId, entryId) {
    try {
      return localStorage.getItem(chipStorageKey(gameId, entryId));
    } catch {
      return null;
    }
  }

  export function setChipLS(gameId, entryId, chip) {
    try {
      localStorage.setItem(chipStorageKey(gameId, entryId), chip);
    } catch {}
  }

  export function clearChipLS(gameId, entryId) {
    try {
      localStorage.removeItem(chipStorageKey(gameId, entryId));
    } catch {}
  }  