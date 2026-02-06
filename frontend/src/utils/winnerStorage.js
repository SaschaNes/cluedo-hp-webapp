function winnerKey(gameId) {
    return `winner:${gameId}`;
  }

  export function getWinner(gameId) {
    if (!gameId) return "";
    try {
      return localStorage.getItem(winnerKey(gameId)) || "";
    } catch {
      return "";
    }
  }

  export function setWinner(gameId, name) {
    if (!gameId) return;
    try {
      localStorage.setItem(winnerKey(gameId), name || "");
    } catch {}
  }
  