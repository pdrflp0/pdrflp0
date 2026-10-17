import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import subsetFont from "subset-font";
import opentype from "opentype.js";

// peças comuns aos geradores de SVG do README: fontes embutidas, medida de texto e paleta
const HERE = dirname(fileURLToPath(import.meta.url));

/* ——— fontes ——— */
const FONT_FILES = {
  serif: "fonts/InstrumentSerif-400.ttf",
  serifI: "fonts/InstrumentSerif-400i.ttf",
  sans: "fonts/Geist-400.ttf",
  sansM: "fonts/Geist-500.ttf",
  mono: "fonts/GeistMono-400.ttf",
  monoM: "fonts/GeistMono-500.ttf",
};
const FACE = {
  serif: ["IS", 400, "normal"],
  serifI: ["IS", 400, "italic"],
  sans: ["G", 400, "normal"],
  sansM: ["G", 500, "normal"],
  mono: ["GM", 400, "normal"],
  monoM: ["GM", 500, "normal"],
};
const ot = Object.fromEntries(Object.entries(FONT_FILES).map(([k, f]) => [k, opentype.parse(readFileSync(join(HERE, f)).buffer.slice(0))]));
export const measure = (font, size, text) => ot[font].getAdvanceWidth(text, size, { kerning: true });

export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Monta um SVG: cada texto passa por t(), que registra os glifos usados de cada fonte. */
export async function build(out, name, w, h, render) {
  const used = Object.fromEntries(Object.keys(FONT_FILES).map((k) => [k, new Set()]));
  const t = (font, x, y, size, text, attrs = "") => {
    for (const ch of text) used[font].add(ch);
    const [fam, wt, st] = FACE[font];
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${fam}" font-weight="${wt}" font-style="${st}" font-size="${size}" ${attrs}>${esc(text)}</text>`;
  };
  const { body, css = "" } = render(t);
  let faces = "";
  for (const [k, set] of Object.entries(used)) {
    if (!set.size) continue;
    const sub = await subsetFont(readFileSync(join(HERE, FONT_FILES[k])), [...set].join("") + " ", { targetFormat: "woff2" });
    const [fam, wt, st] = FACE[k];
    faces += `@font-face{font-family:${fam};font-weight:${wt};font-style:${st};src:url(data:font/woff2;base64,${sub.toString("base64")}) format("woff2")}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><style>${faces}${css}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>${body}</svg>`;
  mkdirSync(out, { recursive: true });
  writeFileSync(`${out}/${name}.svg`, svg);
  console.log(name, (svg.length / 1024).toFixed(1) + " KB");
}

/* ——— paleta (a mesma do portfólio) ——— */
export const C = {
  bg0: "#07090c", bg1: "#0d1117", bg2: "#141a22", bg3: "#1b232d", line: "#232c37",
  text: "#e6edf3", dim: "#8b949e", teal: "#6e9ead", rust: "#b8755e", ok: "#5fb98e", warn: "#d9a441", pink: "#ff4fd8",
};

export const CHECKER = `<pattern id="mt" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#000"/><rect width="3" height="3" fill="#ff00dc"/><rect x="3" y="3" width="3" height="3" fill="#ff00dc"/></pattern>`;
export const frame = (w, h) => `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="16" fill="${C.bg1}" stroke="${C.line}" stroke-width="2"/>`;


export function wrap(font, size, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (measure(font, size, next) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
