import React, { useEffect, useMemo, useState } from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function NewGameModal({
  open,
  onClose,
  onCreate,
  onJoin,

  // ✅ neu:
  currentCode = "",
  gameFinished = false,
  hasGame = false,
  currentMembers = [],
}) {
  // modes: running | choice | create | join
  const [mode, setMode] = useState("choice");
  const [joinCode, setJoinCode] = useState("");
  const [err, setErr] = useState("");
  const [created, setCreated] = useState(null); // { code }
  const [toast, setToast] = useState("");

  const canJoin = useMemo(() => joinCode.trim().length >= 4, [joinCode]);

  // ✅ wichtig: beim Öffnen entscheidet der Modus anhand "läuft vs beendet"
  useEffect(() => {
    if (!open) return;

    setErr("");
    setToast("");
    setJoinCode("");
    setCreated(null);

    // Wenn ein Spiel läuft (und nicht finished) -> nur Code anzeigen
    if (hasGame && !gameFinished) {
      setMode("running");
    } else {
      setMode("choice");
    }
  }, [open, hasGame, gameFinished]);

  if (!open) return null;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1100);
  };

  const doCreate = async () => {
    setErr("");
    try {
      const res = await onCreate();
      setCreated({ code: res.code });
      setMode("create");
    } catch (e) {
      setErr("❌ Fehler: " + (e?.message || "unknown"));
    }
  };

  const doJoin = async () => {
    setErr("");
    try {
      await onJoin(joinCode.trim().toUpperCase());
      onClose();
    } catch (e) {
      setErr("❌ Fehler: " + (e?.message || "unknown"));
    }
  };

  const copyText = async (text, okMsg = "✅ Code kopiert") => {
    try {
      await navigator.clipboard.writeText(text || "");
      showToast(okMsg);
    } catch {
      showToast("❌ Copy nicht möglich");
    }
  };

  const codeToShow =
    (created?.code || "").trim() ||
    (currentCode || "").trim();

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ fontWeight: 1000, color: stylesTokens.textGold }}>
            Spiel
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} aria-label="Schließen">
            ✕
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${stylesTokens.panelBorder}`,
              background: stylesTokens.panelBg,
              color: stylesTokens.textMain,
              fontWeight: 900,
              textAlign: "center",
              animation: "fadeIn 120ms ease-out",
            }}
          >
            {toast}
          </div>
        )}

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {/* ✅ RUNNING: Nur Code anzeigen, keine Choice */}
          {mode === "running" && (
            <>
              <div style={{ color: stylesTokens.textMain, opacity: 0.92 }}>
                Das Spiel läuft noch. Hier ist der <b>Join-Code</b>:
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  padding: 12,
                  borderRadius: 16,
                  border: `1px solid ${stylesTokens.panelBorder}`,
                  background: stylesTokens.panelBg,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>
                  Spiel-Code
                </div>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 1100,
                    letterSpacing: 2,
                    color: stylesTokens.textGold,
                    fontFamily: '"Cinzel Decorative", "IM Fell English", system-ui',
                  }}
                >
                  {codeToShow || "—"}
                </div>

                <button
                  onClick={() => copyText(codeToShow)}
                  style={styles.primaryBtn}
                  disabled={!codeToShow}
                  title={!codeToShow ? "Kein Code verfügbar" : "Code kopieren"}
                >
                  ⧉ Code kopieren
                </button>
              </div>

              <div style={{ fontSize: 12, opacity: 0.75, color: stylesTokens.textDim }}>
                Sobald ein Sieger gesetzt wurde, kannst du hier ein neues Spiel erstellen oder beitreten.
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={styles.primaryBtn}>
                  Fertig
                </button>
              </div>
            </>
          )}

          {currentMembers?.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 14,
                border: `1px solid ${stylesTokens.panelBorder}`,
                background: stylesTokens.panelBg,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>
                Aktuelle Spieler ({currentMembers.length})
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {currentMembers.map((m) => {
                  const name = ((m.display_name || "").trim() || (m.email || "").trim() || "—");
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: `1px solid rgba(233,216,166,0.18)`,
                        background: "rgba(10,10,12,0.35)",
                        color: stylesTokens.textMain,
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      {name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ✅ CHOICE: nur wenn Spiel beendet oder kein Spiel selected */}
          {mode === "choice" && (
            <>
              <div style={{ color: stylesTokens.textMain, opacity: 0.92 }}>
                Willst du ein Spiel <b>erstellen</b> oder einem Spiel <b>beitreten</b>?
              </div>

              <button onClick={doCreate} style={styles.primaryBtn}>
                ✦ Spiel erstellen
              </button>

              <button onClick={() => setMode("join")} style={styles.secondaryBtn}>
                ⎆ Spiel beitreten
              </button>
            </>
          )}

          {mode === "join" && (
            <>
              <div style={{ color: stylesTokens.textMain, opacity: 0.92 }}>
                Gib den <b>Code</b> ein:
              </div>

              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="z.B. 8K3MZQ"
                style={styles.input}
                autoFocus
              />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setMode("choice")} style={styles.secondaryBtn}>
                  Zurück
                </button>
                <button onClick={doJoin} style={styles.primaryBtn} disabled={!canJoin}>
                  Beitreten
                </button>
              </div>
            </>
          )}

          {mode === "create" && created && (
            <>
              <div style={{ color: stylesTokens.textMain, opacity: 0.92 }}>
                Dein Spiel wurde erstellt. Dieser Code bleibt auch bei „Alte Spiele“ sichtbar:
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  padding: 12,
                  borderRadius: 16,
                  border: `1px solid ${stylesTokens.panelBorder}`,
                  background: stylesTokens.panelBg,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>
                  Spiel-Code
                </div>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 1100,
                    letterSpacing: 2,
                    color: stylesTokens.textGold,
                    fontFamily: '"Cinzel Decorative", "IM Fell English", system-ui',
                  }}
                >
                  {created.code}
                </div>

                <button onClick={() => copyText(created?.code || "")} style={styles.primaryBtn}>
                  ⧉ Code kopieren
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={styles.primaryBtn}>
                  Fertig
                </button>
              </div>
            </>
          )}

          {err && <div style={{ color: stylesTokens.textMain, opacity: 0.92 }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}
