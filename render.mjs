// render.mjs — draws the news-image-20261125 entry as a 1024x1024 PNG.
// Node 22 standard library only. Fully deterministic: no clock, no randomness,
// no network, no environment-dependent values. Run: node render.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;
const PAPER = [248, 244, 233];
const INK = [26, 26, 26];
const RED = [163, 22, 33];
const BLUE = [31, 78, 121];
const GREY = [96, 92, 80];

const buf = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}
function fillRect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) px(i, j, c);
  }
}
function hline(x, y, w, c) { fillRect(x, y, w, 1, c); }
function vline(x, y, h, c) { fillRect(x, y, 1, h, c); }
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}
function thickLine(x0, y0, x1, y1, c) {
  line(x0, y0, x1, y1, c);
  line(x0, y0 + 1, x1, y1 + 1, c);
}
function poly(points, c) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(Math.round(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1])));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = xs[k]; x <= xs[k + 1]; x++) px(x, y, c);
    }
  }
}
function circle(cx, cy, r, c, fill) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (fill ? d <= r : Math.abs(d - r) < 0.9) px(cx + x, cy + y, c);
    }
  }
}
function rectOutline(x, y, w, h, c) {
  hline(x, y, w, c);
  hline(x, y + h - 1, w, c);
  vline(x, y, h, c);
  vline(x + w - 1, y, h, c);
}

// ---- 5x7 bitmap font: each glyph is 7 rows of 5 bits ----
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
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
};

function textWidth(s, sc) {
  return s.length * 6 * sc - sc;
}
function drawText(s, x, y, sc, c) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] || FONT[" "];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") fillRect(cx + col * sc, y + r * sc, sc, sc, c);
      }
    }
    cx += 6 * sc;
  }
}
function drawTextC(s, cx, y, sc, c) {
  drawText(s, Math.round(cx - textWidth(s, sc) / 2), y, sc, c);
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
function drawPara(s, x, y, maxW, sc, c, leading) {
  const lines = wrap(s, maxW, sc);
  lines.forEach((ln, i) => drawText(ln, x, y + i * leading, sc, c));
  return lines.length;
}

// ================= MASTHEAD =================
drawTextC("THE GLOBAL CHRONICLE", 512, 30, 7, INK);
fillRect(36, 96, 952, 3, INK);
fillRect(36, 102, 952, 1, INK);
drawTextC("WEDNESDAY 25 NOVEMBER 2026", 512, 114, 2, INK);
hline(36, 138, 952, GREY);

// ================= LEAD STORY: WAR AT SEA =================
rectOutline(36, 150, 952, 250, INK);
drawText("LEAD STORY", 56, 168, 2, RED);
drawText("WAR AT SEA", 56, 192, 5, INK);
fillRect(56, 234, 120, 2, RED);
drawPara(
  "Ukraine confirmed a drone strike on a Russian cargo ship in the Gulf of Finland, and sank a Russian warship in a Libyan port. Norway urged caution.",
  56, 246, 560, 2, INK, 18
);
// ship pictogram, centred near x=800
poly([[700, 300], [900, 300], [880, 336], [720, 336]], BLUE);
vline(800, 214, 86, INK);
poly([[800, 214], [846, 227], [800, 240]], RED);
fillRect(856, 226, 24, 7, INK);
hline(848, 224, 40, INK);
hline(848, 236, 40, INK);
hline(695, 350, 60, BLUE);
hline(775, 350, 70, BLUE);
hline(860, 350, 55, BLUE);
hline(710, 362, 70, BLUE);
hline(800, 362, 60, BLUE);
hline(880, 362, 45, BLUE);

// ================= MIDDLE ROW =================
rectOutline(36, 420, 304, 240, INK);
rectOutline(360, 420, 304, 240, INK);
rectOutline(684, 420, 304, 240, INK);

// --- Markets ---
drawText("MARKETS", 52, 436, 2, RED);
drawText("STOCKS TUMBLE", 52, 458, 3, INK);
vline(60, 488, 50, INK);
hline(60, 537, 256, INK);
thickLine(70, 502, 110, 512, RED);
thickLine(110, 512, 150, 498, RED);
thickLine(150, 498, 190, 520, RED);
thickLine(190, 520, 230, 536, RED);
thickLine(230, 536, 270, 546, RED);
drawPara(
  "Nvidia -6% after +31.5%. Nasdaq -1.5%, Micron -11%, chips -8%. Trump to raise tariffs on China, the EU and 14 nations.",
  52, 552, 272, 2, INK, 16
);

// --- Gaza ---
drawText("GAZA", 376, 436, 2, RED);
drawText("HAMAS CHIEF", 376, 458, 3, INK);
drawText("KILLED", 376, 482, 3, INK);
line(512, 508, 512, 494, RED);
line(512, 508, 498, 496, RED);
line(512, 508, 526, 496, RED);
line(512, 508, 492, 504, RED);
line(512, 508, 532, 504, RED);
fillRect(484, 514, 56, 34, INK);
fillRect(492, 522, 6, 6, PAPER);
fillRect(506, 522, 6, 6, PAPER);
fillRect(520, 522, 6, 6, PAPER);
fillRect(492, 534, 6, 6, PAPER);
fillRect(506, 534, 6, 6, PAPER);
fillRect(520, 534, 6, 6, PAPER);
drawPara(
  "Israeli airstrike kills Naeem Abu Nahel, Hamas internal security director.",
  376, 560, 272, 2, INK, 16
);

// --- Space ---
drawText("SPACE", 700, 436, 2, RED);
drawText("FIRST PAKISTANI", 700, 458, 3, INK);
drawText("IN SPACE", 700, 482, 3, INK);
poly([[836, 500], [824, 522], [848, 522]], RED);
fillRect(824, 522, 24, 24, INK);
circle(836, 534, 4, PAPER, true);
poly([[824, 540], [812, 554], [824, 548]], INK);
poly([[848, 540], [860, 554], [848, 548]], INK);
poly([[829, 546], [836, 560], [843, 546]], RED);
drawPara(
  "Muhammad Zeeshan Ali launches aboard Shenzhou-24 to the Tiangong station.",
  700, 566, 272, 2, INK, 16
);

// ================= BOTTOM ROW =================
rectOutline(36, 680, 416, 200, INK);
rectOutline(472, 680, 516, 200, INK);

// --- Riyadh ---
drawText("RIYADH", 52, 696, 2, RED);
drawText("TOWER ATTACK", 52, 718, 3, INK);
poly([[105, 744], [99, 770], [111, 770]], INK);
circle(105, 744, 3, RED, true);
fillRect(82, 768, 46, 92, INK);
fillRect(90, 780, 8, 8, PAPER);
fillRect(104, 780, 8, 8, PAPER);
fillRect(118, 780, 8, 8, PAPER);
fillRect(90, 796, 8, 8, PAPER);
fillRect(104, 796, 8, 8, PAPER);
fillRect(118, 796, 8, 8, PAPER);
fillRect(90, 812, 8, 8, PAPER);
fillRect(104, 812, 8, 8, PAPER);
fillRect(118, 812, 8, 8, PAPER);
fillRect(90, 828, 8, 8, PAPER);
fillRect(104, 828, 8, 8, PAPER);
fillRect(118, 828, 8, 8, PAPER);
fillRect(90, 844, 8, 8, PAPER);
fillRect(104, 844, 8, 8, PAPER);
fillRect(118, 844, 8, 8, PAPER);
drawPara(
  "Houthis hit the tallest tower in Riyadh, injuring 11. Saudi strikes killed 17 in Hodeida and 26 in Lahj.",
  165, 748, 271, 2, INK, 18
);

// --- Also today ---
drawText("ALSO TODAY", 488, 696, 2, RED);
fillRect(488, 712, 118, 2, RED);
const ALSO = [
  "RUSSIAN PLANE IN S. KOREA AIR ZONE",
  "HASINA TO RETURN HOME 16 DEC",
  "6,500+ ROHINGYA HOME TO MYANMAR IN DEC",
  "AIDS DEATHS 570,000, LOWEST IN 20+ YRS",
  "NEPAL QUAKE 5.6",
  "HUAWEI CONVICTED IN US COURT OVER IRAN",
  "GIULIANI GETS MEDAL OF FREEDOM",
  "ENGLAND BEAT AUSTRALIA IN 2ND T20",
];
ALSO.forEach((item, i) => {
  const y = 716 + i * 20;
  fillRect(488, y + 4, 6, 6, RED);
  drawText(item, 504, y, 2, INK);
});

// ================= FOOTER =================
hline(36, 900, 952, GREY);
drawTextC("THE GLOBAL CHRONICLE - WEDNESDAY 25 NOVEMBER 2026", 512, 916, 2, INK);
drawTextC("ALL STORIES AS REPORTED ON 25 NOVEMBER 2026", 512, 944, 1, GREY);

// ================= PNG ENCODE (zlib + CRC32, stdlib only) =================
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  Buffer.from(buf.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync("entry.png", png);
console.log("wrote entry.png:", png.length, "bytes");
