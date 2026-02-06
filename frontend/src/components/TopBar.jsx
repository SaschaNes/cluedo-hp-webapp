import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function TopBar({
  me,
  userMenuOpen,
  setUserMenuOpen,
  openPwModal,
  openDesignModal,
  openJoinModal,
  doLogout,
  newGame,
}) {
  return (
    <div style={styles.topBar}>
      {/* LINKS */}
      <div>
        <div style={{ fontWeight: 900, color: stylesTokens.textGold }}>Notizbogen</div>
        <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>{me.email}</div>
      </div>

      {/* RECHTS */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "nowrap" }} data-user-menu>
        <div style={{ position: "relative" }}>
          <button onClick={() => setUserMenuOpen((v) => !v)} style={styles.userBtn} title="User Menü">
            <span style={{ fontSize: 16 }}>👤</span>
            <span>User</span>
            <span style={{ opacity: 0.7 }}>▾</span>
          </button>

          {userMenuOpen && (
            <div style={styles.userDropdown}>
              {/* Email Info */}
              <div
                style={{
                  padding: "10px 12px",
                  fontSize: 13,
                  opacity: 0.85,
                  color: stylesTokens.textDim,
                  borderBottom: `1px solid ${stylesTokens.goldLine}`,
                }}
              >
                {me.email}
              </div>

              <button onClick={openPwModal} style={styles.userDropdownItem}>
                Passwort setzen
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  openDesignModal();
                }}
                style={styles.userDropdownItem}
              >
                Design ändern
              </button>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  openJoinModal();
                }}
                style={styles.userDropdownItem}
              >
                Spiel beitreten
              </button>

              <div style={styles.userDropdownDivider} />

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  doLogout();
                }}
                style={{ ...styles.userDropdownItem, color: "#ffb3b3" }}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <button onClick={newGame} style={styles.primaryBtn}>
          ✦ Neues Spiel
        </button>
      </div>
    </div>
  );
}
