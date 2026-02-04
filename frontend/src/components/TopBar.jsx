import React from "react";
import { styles } from "../styles/styles";
import { stylesTokens } from "../styles/theme";

export default function TopBar({
  me,
  userMenuOpen,
  setUserMenuOpen,
  openPwModal,
  doLogout,
  newGame,
}) {
  return (
    <div style={styles.topBar}>
      <div>
        <div style={{ fontWeight: 900, color: stylesTokens.textGold }}>{me.email}</div>
        <div style={{ fontSize: 12, opacity: 0.8, color: stylesTokens.textDim }}>{me.role}</div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }} data-user-menu>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            style={styles.userBtn}
            title="User Menü"
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>👤</span>
            <span>Account</span>
            <span style={{ opacity: 0.8 }}>▾</span>
          </button>

          {userMenuOpen && (
            <div style={styles.userDropdown}>
              <button onClick={openPwModal} style={styles.userDropdownItem}>
                Passwort setzen
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
          + Neues Spiel
        </button>
      </div>
    </div>
  );
}
