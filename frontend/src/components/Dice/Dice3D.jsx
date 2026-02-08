// frontend/src/components/Dice/Dice3D.jsx
import React from "react";

export const cubeRotationForD6 = (value) => {
  switch (value) {
    case 1: return { rx: 0,   ry: 0 };
    case 2: return { rx: -90, ry: 0 };
    case 3: return { rx: 0,   ry: -90 };
    case 4: return { rx: 0,   ry: 90 };
    case 5: return { rx: 90,  ry: 0 };
    case 6: return { rx: 0,   ry: 180 };
    default: return { rx: 0,  ry: 0 };
  }
};

export const PipFace = ({ value }) => {
  const pos = (gx, gy) => ({ left: `${gx * 50}%`, top: `${gy * 50}%` });

  const faces = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
  };

  const arr = faces[value] || faces[1];

  return (
    <div className="pipGrid">
      {arr.map(([x, y], idx) => (
        <div
          key={idx}
          className="pip"
          style={{ ...pos(x, y), transform: "translate(-50%, -50%)" }}
        />
      ))}
    </div>
  );
};

export const DieShell = ({ children, rolling = false, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="die3d"
      style={{
        width: 64,
        height: 64,
        borderRadius: 18,
        border: "none",
        background: "transparent",
        boxShadow: "none",
        position: "relative",
        overflow: "visible",
        display: "grid",
        placeItems: "center",
        cursor: rolling ? "default" : "pointer",
        transition: "transform 160ms ease",
        padding: 0,
        outline: "none",
      }}
      disabled={rolling}
    >
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </button>
  );
};

export const DieD6 = ({ rolling, onClick, ax, ay, onDone, snap = false }) => {
  return (
    <DieShell rolling={rolling} onClick={onClick}>
      <div className="dieCubeWrap">
        <div
          className={`dieCube ${rolling ? "rolling" : ""}`}
          style={{ "--rx": ax, "--ry": ay }}
          onTransitionEnd={(e) => {
            if (e.propertyName !== "transform") return;
            if (rolling) onDone?.();
          }}
        >
          <div className="dieFace front"><PipFace value={1} /></div>
          <div className="dieFace back"><PipFace value={6} /></div>
          <div className="dieFace top"><PipFace value={2} /></div>
          <div className="dieFace bottom"><PipFace value={5} /></div>
          <div className="dieFace right"><PipFace value={3} /></div>
          <div className="dieFace left"><PipFace value={4} /></div>
        </div>
      </div>
    </DieShell>
  );
};

export const HouseDie = ({ face, rolling, onClick, ax, ay, onDone, snap = false }) => {
  const faces = {
    gryffindor: { icon: "🦁", color: "#ef4444" },
    slytherin: { icon: "🐍", color: "#22c55e" },
    ravenclaw: { icon: "🦅", color: "#3b82f6" },
    hufflepuff: { icon: "🦡", color: "#facc15" },
    help: { icon: "🃏", color: "#f2d27a" },
    dark: { icon: "🌙", color: "rgba(255,255,255,0.85)" },
  };

  const order = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff", "help", "dark"];

  return (
    <DieShell rolling={rolling} onClick={onClick}>
      <div className="dieCubeWrap">
        <div
          className={`dieCube ${rolling ? "rolling" : ""}`}
          style={{ "--rx": ax, "--ry": ay }}
          onTransitionEnd={(e) => {
            if (e.propertyName !== "transform") return;
            if (rolling) onDone?.();
          }}
        >
          {order.map((key, i) => {
            const item = faces[key];
            const faceClass =
              i === 0 ? "front" :
              i === 1 ? "top" :
              i === 2 ? "right" :
              i === 3 ? "left" :
              i === 4 ? "bottom" :
              "back";

            return (
              <div key={key} className={`dieFace ${faceClass}`}>
                <div
                  className="specialIcon"
                  style={{
                    color: item.color,
                    textShadow: `0 0 18px ${item.color}55, 0 10px 22px rgba(0,0,0,0.55)`,
                  }}
                >
                  {item.icon}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DieShell>
  );
};
