import React from "react";
import { styles } from "../styles/styles";

export default function LoginPage({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showPw,
  setShowPw,
  doLogin,
}) {
  return (
    <div style={styles.loginPage}>
      <div style={styles.bgFixed} aria-hidden="true">
        <div style={styles.bgMap} />
      </div>

      <div style={styles.candleGlowLayer} aria-hidden="true" />

      <div style={styles.loginCard}>
        <div style={styles.loginTitle}>Zauber-Detektiv Notizbogen</div>

        <div style={styles.loginSubtitle}>Melde dich an, um dein Cluedo-Magie-Sheet zu öffnen</div>

        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <div style={styles.loginFieldWrap}>
            <input
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
              style={styles.loginInput}
              inputMode="email"
              autoComplete="username"
            />
          </div>

          <div style={styles.loginFieldWrap}>
            <div style={styles.inputRow}>
              <input
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Passwort"
                type={showPw ? "text" : "password"}
                style={styles.inputInRow}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={styles.pwToggleBtn}
                aria-label={showPw ? "Passwort verstecken" : "Passwort anzeigen"}
                title={showPw ? "Verstecken" : "Anzeigen"}
              >
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button onClick={doLogin} style={styles.loginBtn}>
            ✦ Anmelden
          </button>
        </div>

        <div style={styles.loginHint}>
          Deine Notizen bleiben privat – jeder Spieler sieht nur seinen eigenen Zettel.
        </div>
      </div>
    </div>
  );
}
