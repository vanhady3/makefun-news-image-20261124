// News in One Image — 24 November 2026
// A newspaper front page summing up Tuesday 24 November 2026, drawn from
// scratch with an own rasterizer and 5x7 bitmap font. Node stdlib only.
// No network, no clock, no randomness: every pixel is fixed, so two runs
// write identical bytes.
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// Palette: warm paper, dark ink, navy masthead, story accents.
const PAPER: RGB = [246, 241, 229];
const INK: RGB = [26, 26, 26];
const NAVY: RGB = [22, 35, 63];
const WHITE: RGB = [255, 255, 255];
const RED: RGB = [178, 38, 30];
const GREEN: RGB = [29, 122, 61];
const GREEN_DK: RGB = [18, 84, 40];
const GREEN_PALE: RGB = [214, 235, 220];
const ORANGE: RGB = [194, 94, 16];
const ORANGE_PALE: RGB = [250, 232, 210];
const GOLD: RGB = [212, 160, 32];
const BLUE_PALE: RGB = [214, 228, 240];
const BLUE: RGB = [38, 84, 138];
const GREY: RGB = [110, 110, 104];
const GREY_LT: RGB = [228, 224, 210];
const BROWN: RGB = [94, 66, 40];
const SMOKE: RGB = [150, 150, 148];

type RGB = [number, number, number];

// ---------------------------------------------------------------- canvas
const buf = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  buf[o] = c[0];
  buf[o + 1] = c[1];
  buf[o + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) px(i, j, c);
  }
}

function frame(x: number, y: number, w: number, h: number, c: RGB, t: number): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

function hline(x: number, y: number, w: number, c: RGB, t: number): void {
  fillRect(x, y, w, t, c);
}

// Bresenham line, square brush of side wd.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB, wd: number): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  const half = Math.floor(wd / 2);
  for (;;) {
    fillRect(x - half, y - half, wd, wd, c);
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

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    fillRect(cx - half, cy + y, half * 2 + 1, 1, c);
  }
}

function circle(cx: number, cy: number, r: number, c: RGB, t: number): void {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    fillRect(
      Math.round(cx + Math.cos(rad) * r) - Math.floor(t / 2),
      Math.round(cy + Math.sin(rad) * r) - Math.floor(t / 2),
      t,
      t,
      c,
    );
  }
}

function fillTriangle(
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB,
): void {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: Array<[number, number, number, number]> = [
      [x0, y0, x1, y1],
      [x1, y1, x2, y2],
      [x2, y2, x0, y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    if (xs.length >= 2) {
      const lo = Math.min(...xs);
      const hi = Math.max(...xs);
      fillRect(Math.ceil(lo), y, Math.floor(hi) - Math.ceil(lo) + 1, 1, c);
    }
  }
}

// ------------------------------------------------------------------- font
// Own 5x7 bitmap font. Each glyph is 7 rows; each row is a 5-bit number,
// bit 4 = leftmost column. Only capitals, digits and punctuation: the whole
// image is set in capitals, newspaper style.
const FONT: Record<string, number[]> = {
  "A": [14, 17, 17, 31, 17, 17, 17],
  "B": [30, 17, 17, 30, 17, 17, 30],
  "C": [14, 17, 16, 16, 16, 17, 14],
  "D": [30, 17, 17, 17, 17, 17, 30],
  "E": [31, 16, 16, 30, 16, 16, 31],
  "F": [31, 16, 16, 30, 16, 16, 16],
  "G": [14, 17, 16, 23, 17, 17, 15],
  "H": [17, 17, 17, 31, 17, 17, 17],
  "I": [14, 4, 4, 4, 4, 4, 14],
  "J": [7, 2, 2, 2, 2, 18, 12],
  "K": [17, 18, 20, 24, 20, 18, 17],
  "L": [16, 16, 16, 16, 16, 16, 31],
  "M": [17, 27, 21, 21, 17, 17, 17],
  "N": [17, 25, 21, 19, 17, 17, 17],
  "O": [14, 17, 17, 17, 17, 17, 14],
  "P": [30, 17, 17, 30, 16, 16, 16],
  "Q": [14, 17, 17, 17, 21, 18, 13],
  "R": [30, 17, 17, 30, 20, 18, 17],
  "S": [15, 16, 16, 14, 1, 1, 30],
  "T": [31, 4, 4, 4, 4, 4, 4],
  "U": [17, 17, 17, 17, 17, 17, 14],
  "V": [17, 17, 17, 17, 17, 10, 4],
  "W": [17, 17, 17, 21, 21, 27, 17],
  "X": [17, 17, 10, 4, 10, 17, 17],
  "Y": [17, 17, 10, 4, 4, 4, 4],
  "Z": [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 6, 8, 16, 31],
  "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2],
  "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14],
  "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 2, 12],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 12, 4, 8],
  ":": [0, 12, 12, 0, 12, 12, 0],
  ";": [0, 12, 12, 0, 12, 4, 8],
  "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 2, 4, 0, 4],
  "'": [4, 4, 8, 0, 0, 0, 0],
  '"': [10, 10, 0, 0, 0, 0, 0],
  "-": [0, 0, 0, 14, 0, 0, 0],
  "/": [1, 2, 2, 4, 8, 8, 16],
  "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8],
  "%": [25, 26, 2, 4, 8, 11, 19],
  "+": [0, 4, 4, 31, 4, 4, 0],
  "=": [0, 0, 31, 0, 31, 0, 0],
  "&": [12, 18, 20, 8, 21, 18, 13],
  "$": [4, 15, 20, 14, 5, 30, 4],
  "#": [10, 10, 31, 10, 31, 10, 10],
  "_": [0, 0, 0, 0, 0, 0, 31],
  ">": [8, 4, 2, 1, 2, 4, 8],
  "<": [2, 4, 8, 16, 8, 4, 2],
  "*": [0, 21, 14, 21, 0, 0, 0],
  "|": [4, 4, 4, 4, 4, 4, 4],
};

function drawChar(x: number, y: number, ch: string, s: number, c: RGB): void {
  const g = FONT[ch] ?? FONT["?"];
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if ((row >> (4 - col)) & 1) {
        fillRect(x + col * s, y + r * s, s, s, c);
      }
    }
  }
}

function textWidth(t: string, s: number): number {
  if (t.length === 0) return 0;
  return t.length * 6 * s - s;
}

function drawText(x: number, y: number, t: string, s: number, c: RGB): void {
  let cx = x;
  for (const ch of t) {
    drawChar(cx, y, ch, s, c);
    cx += 6 * s;
  }
}

function drawTextCentered(cx: number, y: number, t: string, s: number, c: RGB): void {
  drawText(cx - Math.floor(textWidth(t, s) / 2), y, t, s, c);
}

// Greedy word wrap: returns lines that fit maxW at scale s.
function wrapText(t: string, maxW: number, s: number): string[] {
  const words = t.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, s) <= maxW) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawWrapped(x: number, y: number, t: string, s: number, c: RGB, maxW: number, lh: number): number {
  const lines = wrapText(t, maxW, s);
  let yy = y;
  for (const ln of lines) {
    drawText(x, yy, ln, s, c);
    yy += lh;
  }
  return yy;
}

// -------------------------------------------------------------------- png
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function pngEncode(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // Raw scanlines: filter byte 0 + RGB rows.
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ poster art
const BG: RGB = [15, 28, 51];
const PANEL: RGB = [22, 38, 63];
const STEEL: RGB = [60, 90, 130];
const GOLD2: RGB = [212, 160, 32];
const BRIGHT: RGB = [47, 208, 106];
const FOOT: RGB = [150, 160, 175];
const BODY: RGB = [200, 205, 215];
const HULL: RGB = [20, 24, 32];
const SEA: RGB = [38, 84, 138];
const FLAME1: RGB = [255, 176, 32];
const FLAME2: RGB = [240, 90, 20];

// Giant chip: dark-green body, lighter core, gold pins, NVDA label.
function drawChip(x: number, y: number, s: number): void {
  fillRect(x, y, s, s, GREEN_DK);
  fillRect(x + 18, y + 18, s - 36, s - 36, GREEN);
  frame(x + 18, y + 18, s - 36, s - 36, GREEN_DK, 3);
  for (let i = 0; i < 5; i++) {
    const p = 34 + i * 38;
    fillRect(x - 14, y + p, 14, 12, GOLD2); // left pins
    fillRect(x + s, y + p, 14, 12, GOLD2); // right pins
    fillRect(x + p, y - 14, 12, 14, GOLD2); // top pins
    fillRect(x + p, y + s, 12, 14, GOLD2); // bottom pins
  }
  drawTextCentered(x + s / 2, y + 84, "NVDA", 6, WHITE);
  drawTextCentered(x + s / 2, y + 168, "NVIDIA", 2, WHITE);
}

// Steep rising chart with axes, faint grid, dots and an arrowhead.
function drawChart(x0: number, y0: number, x1: number, y1: number): void {
  for (const gy of [320, 400, 480]) {
    hline(x0, gy, x1 - x0, [45, 70, 105], 1);
  }
  line(x0, y0, x0, y1, WHITE, 2);
  line(x0, y1, x1, y1, WHITE, 2);
  const pts: Array<[number, number]> = [
    [410, 520],
    [490, 505],
    [570, 480],
    [650, 440],
    [730, 380],
    [810, 300],
    [890, 210],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], BRIGHT, 6);
  }
  for (const [px2, py2] of pts) {
    fillCircle(px2, py2, 6, BRIGHT);
    fillCircle(px2, py2, 2, WHITE);
  }
  // Arrowhead at the last point, pointing up-right along the final segment.
  fillTriangle(892, 208, 878, 234, 862, 220, BRIGHT);
}

// Orange sun with rays over cracked brown ground.
function drawSunGround(cx: number, sunY: number, gy: number, x0: number, x1: number): void {
  for (let a = 0; a < 360; a += 45) {
    const rad = (a * Math.PI) / 180;
    line(
      Math.round(cx + Math.cos(rad) * 34),
      Math.round(sunY + Math.sin(rad) * 34),
      Math.round(cx + Math.cos(rad) * 46),
      Math.round(sunY + Math.sin(rad) * 46),
      ORANGE,
      4,
    );
  }
  fillCircle(cx, sunY, 26, ORANGE);
  const jag: Array<[number, number]> = [
    [x0, gy + 8],
    [x0 + 46, gy - 2],
    [x0 + 86, gy + 10],
    [x0 + 136, gy - 4],
    [x0 + 186, gy + 8],
    [x0 + 236, gy - 2],
    [x0 + 272, gy + 6],
  ];
  for (let i = 0; i < jag.length - 1; i++) {
    line(jag[i][0], jag[i][1], jag[i + 1][0], jag[i + 1][1], BROWN, 4);
  }
  line(x0 + 90, gy + 6, x0 + 84, gy + 26, BROWN, 3);
  line(x0 + 190, gy + 4, x0 + 198, gy + 24, BROWN, 3);
}

// Burning ship: dark hull on a blue sea, orange flames, grey smoke.
function drawShip(cx: number, seaY: number): void {
  fillCircle(cx - 42, seaY - 62, 10, SMOKE);
  fillCircle(cx + 8, seaY - 76, 12, SMOKE);
  fillCircle(cx + 52, seaY - 62, 9, SMOKE);
  fillTriangle(cx - 58, seaY - 8, cx - 38, seaY - 52, cx - 20, seaY - 8, FLAME1);
  fillTriangle(cx - 14, seaY - 8, cx + 4, seaY - 62, cx + 22, seaY - 8, FLAME2);
  fillTriangle(cx + 28, seaY - 8, cx + 46, seaY - 46, cx + 62, seaY - 8, FLAME1);
  line(cx - 20, seaY - 8, cx - 20, seaY - 48, HULL, 4);
  fillRect(cx - 20, seaY - 48, 26, 12, RED);
  fillRect(cx - 90, seaY - 8, 180, 22, HULL);
  fillTriangle(cx + 90, seaY - 8, cx + 118, seaY - 8, cx + 90, seaY + 14, HULL);
  fillRect(cx - 104, seaY + 14, 236, 20, SEA);
}

// Gold warning triangle with an exclamation mark.
function drawWarning(cx: number, topY: number): void {
  const by = topY + 96;
  line(cx, topY, cx - 50, by, GOLD2, 7);
  line(cx, topY, cx + 50, by, GOLD2, 7);
  line(cx - 50, by, cx + 50, by, GOLD2, 7);
  drawText(cx - 12, topY + 44, "!", 4, GOLD2);
}

// ---------------------------------------------------------------- layout
function main(): void {
  fillRect(0, 0, W, H, BG);
  frame(12, 12, W - 24, H - 24, GOLD2, 4);

  // The day, named big and first.
  drawTextCentered(512, 36, "TUESDAY 24 NOVEMBER 2026", 3, GOLD2);
  hline(44, 46, 224, GOLD2, 3);
  hline(756, 46, 224, GOLD2, 3);

  // Hero panel: the Nvidia day.
  fillRect(28, 84, 968, 516, PANEL);
  frame(28, 84, 968, 516, STEEL, 2);
  drawTextCentered(512, 104, "HUANG IS BACK", 8, WHITE);
  drawTextCentered(512, 172, "NVIDIA BRINGS BACK ITS FOUNDER AS CEO", 2, GOLD2);
  drawTextCentered(512, 198, "SHARES +31% | NASDAQ +6.5% | S&P +4.7% | DOW +3%", 2, BRIGHT);
  drawChip(110, 250, 230);
  drawText(410, 250, "+31%", 9, BRIGHT);
  drawText(410, 322, "NVIDIA SHARES ON MONDAY", 1, BODY);
  drawChart(400, 250, 950, 540);
  drawTextCentered(
    512, 572, "THE BOARD BOWED TO PRESSURE FROM TRUMP AND INVESTORS", 1, BODY,
  );

  hline(28, 618, 968, GOLD2, 3);

  // Bottom row: three visual panels.
  const panels: Array<{ x: number; kick: string; heads: string[]; body: string }> = [
    { x: 28, kick: "CLIMATE", heads: ["CLIMATE", "TALKS", "COLLAPSE"], body: "ANTALYA: NO FOSSIL-FUEL DEAL" },
    { x: 360, kick: "WAR AT SEA", heads: ["WARSHIP", "ABLAZE"], body: "RUSSIAN CORVETTE SUNK OFF LIBYA" },
    { x: 692, kick: "MIDDLE EAST", heads: ["A POISONED", "LAND"], body: "OXFAM: TAINTED FOR DECADES" },
  ];
  for (const p of panels) {
    fillRect(p.x, 640, 304, 300, PANEL);
    frame(p.x, 640, 304, 300, STEEL, 2);
    drawTextCentered(p.x + 152, 656, p.kick, 1, GOLD2);
    let hy = 680;
    for (const ln of p.heads) {
      drawTextCentered(p.x + 152, hy, ln, 3, WHITE);
      hy += 24;
    }
    drawTextCentered(p.x + 152, 908, p.body, 1, BODY);
  }
  drawSunGround(180, 812, 872, 44, 316);
  drawShip(512, 856);
  drawWarning(844, 762);

  // Footer briefs.
  drawTextCentered(
    512,
    962,
    "ALSO: BITCOIN REBOUNDS OFF 2-YEAR LOW, BACK ABOVE $61,000 | SUDAN DRONE STRIKES KILL FOUR | INDONESIA FACTORY FIRE KILLS 24 | LISBON MARCHES OVER PRICES",
    1,
    FOOT,
  );

  const out = process.argv[2] ?? "/output/entry.png";
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, pngEncode());
  console.log("wrote " + out);
}

main();
