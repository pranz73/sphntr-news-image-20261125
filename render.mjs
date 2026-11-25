// render.mjs — The World Gazette, Wednesday 25 November 2026.
// Draws a 1024x1024 broadsheet front page as entry.png.
// Pure Node standard library; fully deterministic (no time, no random, no network).
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;
const PAPER = [246, 241, 229];
const INK = [25, 25, 25];
const RED = [158, 27, 27];
const BLUE = [30, 77, 123];
const LIGHTSEA = [198, 218, 230];
const TEAL = [15, 95, 92];
const GOLD = [150, 105, 20];
const GRAY = [96, 92, 82];

const px = new Uint8Array(W * H * 3);
function set(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) set(i, j, c);
  }
}
function hline(x, y, w, c, t = 1) {
  rect(x, y, w, t, c);
}
function vline(x, y, h, c, t = 1) {
  rect(x, y, t, h, c);
}
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    set(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}
function thickLine(x0, y0, x1, y1, w, c) {
  for (let k = -Math.floor(w / 2); k <= Math.floor(w / 2); k++) {
    line(x0 + k, y0, x1 + k, y1, c);
  }
}
function circle(cx, cy, r, c) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) set(cx + x, cy + y, c);
    }
  }
}
function fillPoly(pts, c) {
  let minY = 1000000;
  let maxY = -1000000;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(Math.round(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1])));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = xs[k]; x <= xs[k + 1]; x++) set(x, y, c);
    }
  }
}
function burst(cx, cy, r, c, n = 12) {
  for (let k = 0; k < n; k++) {
    const a = (k * 2 * Math.PI) / n;
    const len = k % 2 === 0 ? r : Math.round(r * 0.55);
    line(cx, cy, Math.round(cx + len * Math.cos(a)), Math.round(cy + len * Math.sin(a)), c);
  }
}

// 5x7 pixel font, uppercase + digits + punctuation. All copy is set in caps.
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "01010", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  "@": ["01110", "10001", "10111", "10101", "10110", "10000", "01110"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
};
function textWidth(s, sc) {
  return s.length * 6 * sc - sc;
}
function drawText(s, x, y, sc, c) {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] || FONT[" "];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") rect(cx + col * sc, y + r * sc, sc, sc, c);
      }
    }
    cx += 6 * sc;
  }
}
function centerText(s, y, sc, c) {
  drawText(s, Math.round((W - textWidth(s, sc)) / 2), y, sc, c);
}
function wrap(s, maxW, sc) {
  const words = s.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (textWidth(t, sc) <= maxW) {
      cur = t;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawPara(s, x, y, maxW, sc, c, lh) {
  const lines = wrap(s, maxW, sc);
  lines.forEach((ln, i) => drawText(ln, x, y + i * lh, sc, c));
  return lines.length;
}

// PNG encoder (RGB, filter 0, zlib level 9). Deterministic.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG() {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Pictograms, drawn with the primitives above.
function drawShip(cx, cy) {
  // Sea band with three wave lines.
  rect(cx - 130, cy + 52, 260, 30, LIGHTSEA);
  for (let r = 0; r < 3; r++) {
    const wy = cy + 60 + r * 9;
    for (let x = cx - 130; x < cx + 130; x += 4) {
      const yy = wy + Math.round(2 * Math.sin((x - cx + r * 23) / 14));
      set(x, yy, BLUE);
      set(x + 1, yy, BLUE);
    }
  }
  // Hull: trapezoid, deck containers, mast and flag.
  fillPoly(
    [
      [cx - 105, cy - 4],
      [cx + 105, cy - 4],
      [cx + 82, cy + 40],
      [cx - 82, cy + 40],
    ],
    BLUE
  );
  rect(cx - 78, cy - 26, 34, 22, RED);
  rect(cx - 38, cy - 26, 34, 22, GOLD);
  rect(cx + 2, cy - 26, 34, 22, TEAL);
  vline(cx - 52, cy - 78, 74, INK, 3);
  fillPoly(
    [
      [cx - 49, cy - 78],
      [cx - 8, cy - 68],
      [cx - 49, cy - 58],
    ],
    RED
  );
  // Drone above the ship: body, arms, four rotors, red light.
  const dx = cx + 62;
  const dy = cy - 46;
  rect(dx - 13, dy - 5, 26, 10, INK);
  line(dx - 13, dy, dx - 30, dy - 12, INK);
  line(dx + 13, dy, dx + 30, dy - 12, INK);
  line(dx - 13, dy, dx - 30, dy + 12, INK);
  line(dx + 13, dy, dx + 30, dy + 12, INK);
  circle(dx - 30, dy - 12, 6, INK);
  circle(dx + 30, dy - 12, 6, INK);
  circle(dx - 30, dy + 12, 6, INK);
  circle(dx + 30, dy + 12, 6, INK);
  circle(dx, dy + 7, 2, RED);
}
function drawChart(x, y, w, h) {
  // Axes.
  hline(x, y + h - 6, w, INK, 2);
  vline(x, y, h - 6, INK, 2);
  // Five descending bars.
  const bars = [62, 50, 38, 26, 14];
  const bw = 26;
  const gap = 12;
  bars.forEach((bh, i) => {
    const bx = x + 16 + i * (bw + gap);
    const col = i < 3 ? BLUE : RED;
    rect(bx, y + h - 6 - bh, bw, bh, col);
  });
  // Red down arrow across the bars.
  thickLine(x + 14, y + 2, x + w - 26, y + h - 18, 4, RED);
  fillPoly(
    [
      [x + w - 34, y + h - 30],
      [x + w - 6, y + h - 30],
      [x + w - 20, y + h - 2],
    ],
    RED
  );
  drawText("-6-7%", x + w - 62, y + 2, 2, RED);
}
function drawBuilding(x, y, w, h) {
  // Two buildings with lit windows, and a burst above the taller one.
  rect(x + 8, y + 26, 52, h - 26, INK);
  rect(x + 72, y + 8, 46, h - 8, BLUE);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      rect(x + 16 + c * 14, y + 34 + r * 12, 6, 6, PAPER);
    }
  }
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 2; c++) {
      rect(x + 80 + c * 16, y + 16 + r * 11, 6, 6, PAPER);
    }
  }
  burst(x + 150, y + 12, 14, RED, 10);
}
function drawRocket(x, y, w, h) {
  // Stars, crescent moon, rocket body, nose, fins, flame.
  const stars = [
    [x + 8, y + 6],
    [x + 30, y + 22],
    [x + 200, y + 8],
    [x + 222, y + 30],
    [x + 176, y + 18],
  ];
  for (const s of stars) {
    rect(s[0] - 4, s[1] - 1, 9, 2, INK);
    rect(s[0] - 1, s[1] - 4, 2, 9, INK);
  }
  circle(x + 208, y + 16, 12, GOLD);
  circle(x + 213, y + 12, 11, PAPER);
  const cx = x + 110;
  fillPoly(
    [
      [cx - 11, y + 8],
      [cx + 11, y + 8],
      [cx, y - 12],
    ],
    RED
  );
  rect(cx - 11, y + 8, 22, 34, INK);
  circle(cx, y + 22, 5, PAPER);
  fillPoly(
    [
      [cx - 11, y + 34],
      [cx - 24, y + 46],
      [cx - 11, y + 42],
    ],
    TEAL
  );
  fillPoly(
    [
      [cx + 11, y + 34],
      [cx + 24, y + 46],
      [cx + 11, y + 42],
    ],
    TEAL
  );
  fillPoly(
    [
      [cx - 7, y + 42],
      [cx + 7, y + 42],
      [cx, y + 52],
    ],
    GOLD
  );
  fillPoly(
    [
      [cx - 4, y + 42],
      [cx + 4, y + 42],
      [cx, y + 48],
    ],
    RED
  );
}
function drawTower(x, y, w, h) {
  // Tall tower with arched top, floor lines, burst at the crown.
  const cx = x + 70;
  rect(cx - 16, y + 10, 32, h - 10, INK);
  circle(cx, y + 10, 16, INK);
  rect(cx - 16, y + 10, 32, 6, INK);
  for (let r = 0; r < 5; r++) {
    rect(cx - 10, y + 22 + r * 10, 20, 2, PAPER);
  }
  rect(cx - 26, y + h - 8, 52, 8, INK);
  burst(x + 250, y + 18, 10, RED, 10);
  // Small neighbouring blocks.
  rect(x + 150, y + 34, 40, h - 34, BLUE);
  rect(x + 198, y + 46, 30, h - 46, TEAL);
}

// Panel frame with kicker and rule.
function panel(x, y, w, h, kicker, kc) {
  rect(x, y, w, 2, INK);
  rect(x, y + h - 2, w, 2, INK);
  rect(x, y, 2, h, INK);
  rect(x + w - 2, y, 2, h, INK);
  drawText(kicker, x + 16, y + 12, 2, kc);
  hline(x + 16, y + 30, w - 32, GRAY, 1);
}

// ---- Page composition ----
rect(0, 0, W, H, PAPER);
// Outer border.
rect(20, 20, W - 40, 2, INK);
rect(20, H - 22, W - 40, 2, INK);
rect(20, 20, 2, H - 40, INK);
rect(W - 22, 20, 2, H - 40, INK);

// Top strip.
drawText("VOL. I - NO. 329", 36, 36, 2, INK);
centerText("WEDNESDAY 25 NOVEMBER 2026", 36, 2, INK);
drawText("PRICE FREE", 988 - textWidth("PRICE FREE", 2), 36, 2, INK);

// Masthead.
drawText("THE WORLD GAZETTE", 108, 60, 8, INK);
hline(34, 126, 956, INK, 3);
hline(34, 132, 956, INK, 1);
centerText("THE DAY IN FULL - FIVE STORIES THAT MOVED THE WORLD", 142, 2, INK);

// Lead story: war at sea.
panel(34, 164, 956, 256, "WAR AT SEA", RED);
drawShip(190, 300);
drawPara("UKRAINE SINKS RUSSIAN WARSHIP, HITS CARGO SHIP", 350, 208, 620, 3, INK, 26);
drawPara(
  "KYIV CONFIRMED DRONE STRIKES ON A RUSSIAN CARGO SHIP IN THE GULF OF FINLAND AND SANK A RUSSIAN WARSHIP IN A LIBYAN PORT. NORWAY URGED CAUTION AS TENSIONS ROSE AT SEA.",
  350,
  272,
  620,
  2,
  INK,
  18
);
drawPara(
  "THE STRIKES MARK A SHARP ESCALATION OF THE WAR AT SEA.",
  350,
  356,
  620,
  2,
  GRAY,
  18
);

// Row 2: markets and Gaza.
panel(34, 434, 470, 232, "MARKETS", RED);
drawChart(50, 472, 438, 62);
drawPara("NVIDIA SLIDES 6-7% AFTER 31.5% SURGE", 50, 536, 438, 3, INK, 26);
drawPara(
  "NASDAQ -1.5%. MICRON -11%. CHIP INDEX -8%. TRUMP READIED TARIFF HIKES ON CHINA, THE EU AND 14 MORE.",
  50,
  594,
  438,
  2,
  INK,
  17
);
panel(520, 434, 470, 232, "GAZA", RED);
drawBuilding(536, 472, 438, 62);
drawPara("ISRAELI STRIKE KILLS HAMAS SECURITY CHIEF", 536, 536, 438, 3, INK, 26);
drawPara(
  "NAEEM ABU NAHEL, HAMAS INTERNAL SECURITY DIRECTOR, WAS KILLED IN AN ISRAELI AIRSTRIKE IN GAZA.",
  536,
  594,
  438,
  2,
  INK,
  17
);

// Row 3: space and Riyadh.
panel(34, 680, 470, 196, "SPACE", RED);
drawRocket(50, 714, 438, 52);
drawPara("PAKISTANI ASTRONAUT REACHES TIANGONG", 50, 768, 438, 3, INK, 26);
drawPara(
  "MUHAMMAD ZEESHAN ALI, FIRST PAKISTANI ASTRONAUT, FLEW ON SHENZHOU-24 TO TIANGONG.",
  50,
  826,
  438,
  2,
  INK,
  16
);
panel(520, 680, 470, 196, "RIYADH", RED);
drawTower(536, 714, 438, 52);
drawPara("HOUTHIS HIT RIYADH'S TALLEST TOWER", 536, 768, 438, 3, INK, 26);
drawPara(
  "ELEVEN PEOPLE WERE INJURED. SAUDI STRIKES KILLED 17 IN HODEIDA AND 26 IN LAHJ.",
  536,
  826,
  438,
  2,
  INK,
  16
);

// Also today strip.
rect(34, 886, 956, 2, INK);
rect(34, 976, 956, 2, INK);
drawText("ALSO TODAY", 48, 894, 2, RED);
hline(48, 912, 928, GRAY, 1);
drawPara(
  "RUSSIAN PLANE IN SOUTH KOREA AIR ZONE. HASINA RETURNS 16 DEC. MALAYSIA SENDS 6,500+ ROHINGYA HOME. ENGLAND BEAT AUSTRALIA IN 2ND T20. AIDS DEATHS 570,000 IN 2025, LOWEST IN 20 YEARS. NEPAL QUAKE M5.6. HUAWEI CONVICTED IN US COURT. GIULIANI GIVEN MEDAL OF FREEDOM.",
  48,
  918,
  928,
  2,
  INK,
  14
);

// Footer.
centerText("THE WORLD GAZETTE - WEDNESDAY 25 NOVEMBER 2026 - PAGE ONE", 986, 2, GRAY);

const out = encodePNG();
writeFileSync("entry.png", out);
console.log("wrote entry.png", out.length, "bytes, 1024x1024");
