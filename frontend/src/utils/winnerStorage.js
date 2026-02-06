// frontend/src/utils/winnerStorage.js

function winnerKey(gameId) {
  return `winner:${gameId}`;
}

export function getWinnerLS(gameId) {
  if (!gameId) return "";
  try {
    return localStorage.getItem(winnerKey(gameId)) || "";
  } catch {
    return "";
  }
}

export function setWinnerLS(gameId, name) {
  if (!gameId) return;
  try {
    localStorage.setItem(winnerKey(gameId), (name || "").trim());
  } catch {}
}

export function clearWinnerLS(gameId) {
  if (!gameId) return;
  try {
    localStorage.removeItem(winnerKey(gameId));
  } catch {}
}
