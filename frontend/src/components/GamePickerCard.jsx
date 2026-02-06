import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function GamePickerCard({
  games,
  gameId,
  setGameId,
  onOpenHelp,
  members = [],
  me,
  hostUserId,
}) {
  const cur = games.find((x) => x.id === gameId);

  const renderMemberName = (m) => {
    const base = ((m.display_name || "").trim() || (m.email || "").trim() || "—");
    const isMe = !!(me?.id && String(me.id) === String(m.id));
    const isHost = !!(hostUserId && String(hostUserId) === String(m.id));

    const suffix = `${isHost ? " ⭐" : ""}${isMe ? " (du)" : ""}`;
    return base + suffix;
  };

  const pillStyle = (isHost, isMe) => ({
    padding: "7px 10px",
    borderRadius: 999,
    border: `1px solid ${
      isHost ? "rgba(233,216,166,0.35)" : "rgba(233,216,166,0.16)"
    }`,
    background: isHost
      ? "linear-gradient(180deg, rgba(233,216,166,0.14), rgba(10,10,12,0.35))"
      : "rgba(10,10,12,0.30)",
    color: stylesTokens.textMain,
    fontSize: 13,
    fontWeight: 950,
    boxShadow: isHost ? "0 8px 18px rgba(0,0,0,0.25)" : "none",
    opacity: isMe ? 1 : 0.95,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ marginTop: 14 }}>
      <div style={styles.card}>
        <div style={styles.sectionHeader}>Spiel</div>

        <div style={styles.cardBody}>
          <select
            value={gameId || ""}
            onChange={(e) => setGameId(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} {g.code ? `• ${g.code}` : ""}
              </option>
            ))}
          </select>

          <button onClick={onOpenHelp} style={styles.helpBtn} title="Hilfe">
            Hilfe
          </button>
        </div>

        {/* Code Zeile */}
        {cur?.code && (
          <div
            style={{
              padding: "0 12px 10px",
              fontSize: 12,
              color: stylesTokens.textDim,
              opacity: 0.92,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div>
              Code: <b style={{ color: stylesTokens.textGold }}>{cur.code}</b>
            </div>
          </div>
        )}

        {/* Spieler */}
        {members?.length > 0 && (
          <div style={{ padding: "0 12px 12px" }}>
            <div
              style={{
                fontSize: 12,
                opacity: 0.85,
                color: stylesTokens.textDim,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>Spieler</div>
              <div style={{ fontWeight: 900, color: stylesTokens.textGold }}>
                {members.length}
              </div>
            </div>

            <div
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: 16,
                border: `1px solid rgba(233,216,166,0.10)`,
                background: "rgba(10,10,12,0.18)",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {members.map((m) => {
                const isMe = !!(me?.id && String(me.id) === String(m.id));
                const isHost = !!(hostUserId && String(hostUserId) === String(m.id));
                const label = renderMemberName(m);

                return (
                  <div key={m.id} style={pillStyle(isHost, isMe)} title={label}>
                    {isHost && <span style={{ color: stylesTokens.textGold }}>⭐</span>}
                    <span>{label.replace(" ⭐", "")}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7, color: stylesTokens.textDim }}>
              ⭐ = Host &nbsp;&nbsp;•&nbsp;&nbsp; (du) = du
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
