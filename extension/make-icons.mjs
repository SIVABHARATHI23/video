// Generates icon16/48/128.png for the extension — a blue rounded square with a
// white download arrow. Pure Node (zlib only), no external deps.
// Run:  node extension/make-icons.mjs
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));

// CRC32 (PNG chunks)
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
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const BRAND = [37, 99, 235]; // #2563eb
const WHITE = [255, 255, 255];

function inArrow(nx, ny) {
  // normalized coords 0..1; draw a download arrow
  const stem = nx >= 0.43 && nx <= 0.57 && ny >= 0.2 && ny <= 0.56;
  // arrowhead: triangle pointing down, tip at (0.5, 0.75)
  const headTop = 0.5;
  const headBottom = 0.76;
  let head = false;
  if (ny >= headTop && ny <= headBottom) {
    const t = (ny - headTop) / (headBottom - headTop); // 0..1 top->tip
    const halfW = 0.22 * (1 - t);
    head = Math.abs(nx - 0.5) <= halfW;
  }
  const base = nx >= 0.28 && nx <= 0.72 && ny >= 0.82 && ny <= 0.9;
  return stem || head || base;
}

function makePng(size) {
  const r = size * 0.18; // corner radius
  const bytesPerPixel = 4;
  const raw = Buffer.alloc(size * (1 + size * bytesPerPixel));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * bytesPerPixel);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const o = rowStart + 1 + x * bytesPerPixel;
      // rounded-corner alpha mask
      let alpha = 255;
      const cx = Math.min(x, size - 1 - x);
      const cy = Math.min(y, size - 1 - y);
      if (cx < r && cy < r) {
        const dx = r - cx;
        const dy = r - cy;
        if (dx * dx + dy * dy > r * r) alpha = 0;
      }
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const col = inArrow(nx, ny) ? WHITE : BRAND;
      raw[o] = col[0];
      raw[o + 1] = col[1];
      raw[o + 2] = col[2];
      raw[o + 3] = alpha;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [16, 48, 128]) {
  const out = path.join(DIR, `icon${size}.png`);
  fs.writeFileSync(out, makePng(size));
  console.log("wrote", out);
}
