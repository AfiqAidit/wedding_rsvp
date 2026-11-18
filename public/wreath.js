"use strict";
// Draws the flower wreath around the cover's oval as SVG (roses, peonies, leaves), no image file needed.
// Deterministic: the same arrangement every load. Replace by dropping a real image at CARD.wreathImage.

window.buildWreath = function buildWreath() {
  const W = 354, H = 463, CX = W / 2, CY = H / 2;
  const NS = "http://www.w3.org/2000/svg";

  // Small seeded random so the arrangement never changes between loads.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Flower palettes: [light, mid, dark]
  const PAL = [
    ["#fbe4e2", "#f0b9bd", "#c9747f"], // blush
    ["#f6cfc9", "#dc8f94", "#a8475a"], // rose
    ["#d99a8d", "#b8625c", "#7d2f35"], // terracotta
    ["#a8283e", "#7a1328", "#4a0716"], // burgundy
    ["#f7e9e3", "#e9c4c0", "#bb7c80"], // cream
  ];

  let defs = "";
  PAL.forEach(([l, m, d], i) => {
    defs += `<radialGradient id="fg${i}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="${l}"/><stop offset=".6" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></radialGradient>`;
  });
  defs += `<linearGradient id="lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4c7d52"/><stop offset="1" stop-color="#24472f"/></linearGradient>`;
  defs += `<linearGradient id="lf2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b9a6a"/><stop offset="1" stop-color="#2f5a3a"/></linearGradient>`;

  const leaf = (x, y, len, rot, alt) => {
    const w = len * 0.34;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})">
      <path d="M0 0C${len * 0.3} ${-w} ${len * 0.75} ${-w * 0.9} ${len} 0C${len * 0.75} ${w * 0.9} ${len * 0.3} ${w} 0 0Z" fill="url(#${alt ? "lf2" : "lf"})"/>
      <path d="M2 0L${len * 0.92} 0" stroke="#e7efe0" stroke-opacity=".35" stroke-width=".7"/></g>`;
  };

  const rose = (x, y, r, pi, rot) => {
    const [l, m, d] = PAL[pi];
    let s = `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})">`;
    s += `<circle r="${(r * 1.04).toFixed(1)}" fill="${d}" opacity=".55"/>`;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      s += `<ellipse cx="${(Math.cos(a) * r * 0.5).toFixed(1)}" cy="${(Math.sin(a) * r * 0.5).toFixed(1)}" rx="${(r * 0.52).toFixed(1)}" ry="${(r * 0.46).toFixed(1)}" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(Math.cos(a) * r * 0.5).toFixed(1)} ${(Math.sin(a) * r * 0.5).toFixed(1)})" fill="url(#fg${pi})" stroke="${d}" stroke-opacity=".35" stroke-width=".6"/>`;
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.5;
      s += `<ellipse cx="${(Math.cos(a) * r * 0.28).toFixed(1)}" cy="${(Math.sin(a) * r * 0.28).toFixed(1)}" rx="${(r * 0.34).toFixed(1)}" ry="${(r * 0.3).toFixed(1)}" fill="url(#fg${pi})" stroke="${d}" stroke-opacity=".4" stroke-width=".6"/>`;
    }
    s += `<circle r="${(r * 0.2).toFixed(1)}" fill="${l}" stroke="${d}" stroke-opacity=".5" stroke-width=".7"/>`;
    s += `<path d="M${-r * 0.12} 0a${r * 0.12} ${r * 0.12} 0 1 1 ${r * 0.24} 0" fill="none" stroke="${d}" stroke-opacity=".5" stroke-width=".7"/>`;
    return s + "</g>";
  };

  // Where flowers sit: angle (deg, 0 = top, clockwise), size, palette, distance factor.
  const FL = [
    [318, 40, 0, 1.0], [336, 34, 3, 1.02], [352, 27, 1, 1.0], [300, 30, 2, 1.0], [284, 24, 4, 1.02],
    [14, 22, 4, 1.03], [40, 20, 0, 1.0],
    [246, 22, 1, 1.02], [222, 30, 2, 1.0], [205, 24, 4, 1.0],
    [78, 18, 0, 1.03], [98, 22, 3, 1.0],
    [122, 30, 1, 1.0], [140, 40, 0, 1.0], [158, 34, 3, 1.02], [176, 28, 2, 1.0],
  ];
  const RX = 127, RY = 200, GROW = 1.22; // GROW scales every flower up

  let back = "", front = "";
  // Leaves first (behind flowers), spread all around the ring.
  for (let deg = 0; deg < 360; deg += 11) {
    const a = ((deg - 90) * Math.PI) / 180;
    const x = CX + Math.cos(a) * (RX + 2), y = CY + Math.sin(a) * (RY + 2);
    const tangent = (deg * Math.PI) / 180;
    const rot = (Math.atan2(Math.sin(a), Math.cos(a)) * 180) / Math.PI + (rnd() > 0.5 ? 1 : -1) * (35 + rnd() * 40);
    back += leaf(x, y, 34 + rnd() * 22, rot, rnd() > 0.6);
    if (rnd() > 0.4) back += leaf(x, y, 28 + rnd() * 18, rot + 160 + rnd() * 40, rnd() > 0.5);
    void tangent;
  }
  for (const [deg, size, pi, k] of FL) {
    const a = ((deg - 90) * Math.PI) / 180;
    const x = CX + Math.cos(a) * RX * k, y = CY + Math.sin(a) * RY * k;
    front += rose(x, y, size * GROW, pi, rnd() * 360);
  }
  // A few small buds on the outer edge for texture.
  for (let i = 0; i < 12; i++) {
    const deg = rnd() * 360, a = ((deg - 90) * Math.PI) / 180;
    const x = CX + Math.cos(a) * (RX + 26), y = CY + Math.sin(a) * (RY + 22);
    front += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2 + rnd() * 2.5).toFixed(1)}" fill="${PAL[(i % 2) + 1][1]}" opacity=".85"/>`;
  }

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "wreath-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `<defs>${defs}</defs>${back}${front}`;
  return svg;
};
