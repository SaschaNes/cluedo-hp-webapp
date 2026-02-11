// frontend/src/components/Dice/DicePanel.jsx
import React, { useEffect, useRef, useState } from "react";
import { cubeRotationForD6, DieD6, HouseDie } from "./Dice3D.jsx";

export default function DicePanel({ onRoll }) {
  const LS_KEY = "hp_cluedo_dice_v1";

  const [d1, setD1] = useState(4);
  const [d2, setD2] = useState(2);
  const [special, setSpecial] = useState("gryffindor");

  const [a1, setA1] = useState({ x: 0, y: 90 });
  const [a2, setA2] = useState({ x: -90, y: 0 });
  const [as, setAs] = useState({ x: 0, y: 0 });

  const [rolling, setRolling] = useState(false);

  const specialFaces = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff", "help", "dark"];
  const order = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff", "help", "dark"];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // roll bookkeeping
  const pendingRef = useRef(null);
  const doneForRollRef = useRef({ d1: false, d2: false, s: false });

  // restore last
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (parsed?.d1) setD1(parsed.d1);
      if (parsed?.d2) setD2(parsed.d2);
      if (parsed?.special) setSpecial(parsed.special);

      if (parsed?.d1) {
        const r = cubeRotationForD6(parsed.d1);
        setA1({ x: r.rx, y: r.ry });
      }
      if (parsed?.d2) {
        const r = cubeRotationForD6(parsed.d2);
        setA2({ x: r.rx, y: r.ry });
      }
      if (parsed?.special) {
        const idx = Math.max(0, order.indexOf(parsed.special));
        const r = cubeRotationForD6(idx + 1);
        setAs({ x: r.rx, y: r.ry });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ d1, d2, special }));
    } catch {}
  }, [d1, d2, special]);

  const normalize360 = (n) => ((n % 360) + 360) % 360;

  const rollTo = (currentAngles, targetBase) => {
    const spinX = 720 + randInt(0, 2) * 360;
    const spinY = 720 + randInt(0, 2) * 360;

    const currX = normalize360(currentAngles.x);
    const currY = normalize360(currentAngles.y);

    const dx = targetBase.rx - currX;
    const dy = targetBase.ry - currY;

    return { x: currentAngles.x + spinX + dx, y: currentAngles.y + spinY + dy };
  };

  const rollAll = () => {
    if (rolling) return;

    const nd1 = randInt(1, 6);
    const nd2 = randInt(1, 6);
    const ns = specialFaces[randInt(0, specialFaces.length - 1)];

    const r1 = cubeRotationForD6(nd1);
    const r2 = cubeRotationForD6(nd2);
    const rs = cubeRotationForD6(Math.max(0, order.indexOf(ns)) + 1);

    pendingRef.current = { nd1, nd2, ns };

    doneForRollRef.current = { d1: false, d2: false, s: false };

    setRolling(true);

    setA1((cur) => rollTo(cur, r1));
    setA2((cur) => rollTo(cur, r2));
    setAs((cur) => rollTo(cur, rs));
  };

  const maybeCommit = () => {
    const flags = doneForRollRef.current;
    if (!flags.d1 || !flags.d2 || !flags.s) return;

    const p = pendingRef.current;
    if (!p) return;

    // ✅ rolling beenden
    setRolling(false);

    // ✅ Ergebnis state setzen
    setD1(p.nd1);
    setD2(p.nd2);
    setSpecial(p.ns);

    pendingRef.current = null;

    onRoll?.({ d1: p.nd1, d2: p.nd2, special: p.ns });
  };
  

  const onDoneD1 = () => {
    if (!rolling) return;
    if (doneForRollRef.current.d1) return;
    doneForRollRef.current.d1 = true;
    maybeCommit();
  };

  const onDoneD2 = () => {
    if (!rolling) return;
    if (doneForRollRef.current.d2) return;
    doneForRollRef.current.d2 = true;
    maybeCommit();
  };

  const onDoneS = () => {
    if (!rolling) return;
    if (doneForRollRef.current.s) return;
    doneForRollRef.current.s = true;
    maybeCommit();
  };

  return (
    <div style={{ pointerEvents: "auto" }}>
      <div
        className="diceRow3d"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          alignItems: "center",
          justifyItems: "center",
          overflow: "visible",
        }}
      >
        <DieD6 rolling={rolling} onClick={rollAll} ax={a1.x} ay={a1.y} onDone={onDoneD1} />
        <DieD6 rolling={rolling} onClick={rollAll} ax={a2.x} ay={a2.y} onDone={onDoneD2} />
        <HouseDie face={special} rolling={rolling} onClick={rollAll} ax={as.x} ay={as.y} onDone={onDoneS} />
      </div>
    </div>
  );
}
