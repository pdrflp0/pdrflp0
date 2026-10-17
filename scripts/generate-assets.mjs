import { build as buildSvg, measure, C, CHECKER, frame, wrap } from "./svg-kit.mjs";

const OUT = process.argv[2];
const build = (name, w, h, render) => buildSvg(OUT, name, w, h, render);

/* ——— HEADER: o painel com o nome, o terminal e o mapa isométrico ——— */
const HT = {
  en: {
    nominal: "all systems nominal", kicker: "OPEN TO INTERNSHIPS & JUNIOR ROLES · FORTALEZA, BRAZIL",
    lines: [["whoami", "back-end developer · Java & TypeScript"], ["focus", "distributed systems · concurrency"], ["stack", "Spring Boot · NestJS · PostgreSQL · AWS SQS"], ["status", "open to internships & junior roles"]],
    fig: "fig. 1 — what the map wasn't meant to show",
  },
  pt: {
    nominal: "todos os sistemas operando", kicker: "ABERTO A ESTÁGIO E VAGAS JÚNIOR · FORTALEZA, CE",
    lines: [["whoami", "dev back-end · Java & TypeScript"], ["foco", "sistemas distribuídos · concorrência"], ["stack", "Spring Boot · NestJS · PostgreSQL · AWS SQS"], ["status", "aberto a estágio e vagas júnior"]],
    fig: "fig. 1 — o que o mapa não devia mostrar",
  },
};

async function header(lang) {
  const W = 1200, H = 470, L = HT[lang];
  await build(lang === "en" ? "header" : "header-pt", W, H, (t) => {
    // mapa isométrico (mesma geometria do site, em tons obsidian)
    const T = 38, Cs = 0.866, OX = 912, OY = 112, N = 7, HW = 2.4;
    const P = (x, y, z = 0) => [OX + (x - y) * T * Cs, OY + (x + y) * T * 0.5 - z * T];
    const pts = (...vs) => vs.map((v) => P(...v).map((n) => n.toFixed(1)).join(",")).join(" ");
    const box = ([x, y, z], [dx, dy, dz], fills) =>
      `<polygon points="${pts([x, y, z + dz], [x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x, y + dy, z + dz])}" fill="${fills[0]}" stroke="#2b3440"/>` +
      `<polygon points="${pts([x, y + dy, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x, y + dy, z + dz])}" fill="${fills[1]}" stroke="#2b3440"/>` +
      `<polygon points="${pts([x + dx, y, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x + dx, y, z + dz])}" fill="${fills[2]}" stroke="#2b3440"/>`;

    let grid = "";
    for (let i = 1; i < N; i++) {
      const [a, b] = [P(i, 0), P(i, N)], [c, d] = [P(0, i), P(N, i)];
      grid += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><line x1="${c[0]}" y1="${c[1]}" x2="${d[0]}" y2="${d[1]}"/>`;
    }
    let seams = "";
    for (let i = 1; i < N; i++) {
      const [a, b] = [P(0, i, 0), P(0, i, HW)], [c, d] = [P(i, 0, 0), P(i, 0, HW)];
      seams += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><line x1="${c[0]}" y1="${c[1]}" x2="${d[0]}" y2="${d[1]}"/>`;
    }

    // rota do jogador: digita no PC → parede quebrada → atravessa → borda → cai → respawn
    const DESK = [4.4, 1.85];
    const route = [
      { to: DESK, dur: 2.6, state: "type" },
      { to: [2.4, 1.85], walk: true },
      { to: [2.4, 2.5], walk: true },
      { to: [0.42, 2.5], walk: true },
      { to: [0.42, 2.5], dur: 0.35 },
      { to: [-0.18, 2.5], dur: 1.1, glitch: true },
      { to: [0.42, 2.5], dur: 0.45, glitch: true },
      { to: [0.42, 2.5], dur: 0.4 },
      { to: [2.1, 2.5], walk: true },
      { to: [2.1, 5.7], walk: true },
      { to: [5.6, 5.7], walk: true },
      { to: [5.6, 6.9], walk: true },
      { to: [5.6, 6.9], dur: 0.6 },
      { to: [5.6, 7.45], walk: true },
      { to: [5.6, 7.45], dur: 0.75, fall: true },
      { to: DESK, dur: 0.01, teleport: true },
      { to: DESK, dur: 0.5, spawn: true },
    ];
    const SPEED = 1.7;
    let pos = DESK, time = 0, facing = 1;
    const frames = []; // {t, x, y, z, f, o}
    const legs = []; // janelas de caminhada
    const glitch = [];
    const push = (t, p, z = 0, o = 1) => {
      const [x, y] = P(p[0], p[1], z);
      frames.push({ t, x, y, f: facing, o });
    };
    push(0, pos);
    for (const s of route) {
      const dist = Math.hypot(s.to[0] - pos[0], s.to[1] - pos[1]);
      const dur = s.walk ? dist / SPEED : s.dur;
      if (s.walk) {
        const dx = P(...s.to)[0] - P(...pos)[0];
        if (Math.abs(dx) > 0.5) {
          const nf = dx < 0 ? -1 : 1;
          if (nf !== facing) { facing = nf; push(time + 0.001, pos); }
        }
        legs.push([time, time + dur]);
      }
      if (s.glitch) glitch.push([time, time + dur]);
      if (s.fall) {
        push(time + dur, s.to, -4.5, 0);
      } else if (s.teleport) {
        push(time + dur, s.to, 0, 0);
      } else if (s.spawn) {
        push(time + dur * 0.25, s.to, 0, 1);
        push(time + dur * 0.5, s.to, 0, 0.2);
        push(time + dur, s.to, 0, 1);
      } else {
        push(time + dur, s.to);
      }
      pos = s.to;
      time += dur;
    }
    const TOTAL = time;
    const pct = (t) => ((t / TOTAL) * 100).toFixed(3) + "%";
    let kf = "";
    for (const fr of frames) kf += `${pct(fr.t)}{transform:translate(${fr.x.toFixed(1)}px,${fr.y.toFixed(1)}px) scale(${fr.f},1);opacity:${fr.o}}`;
    // pernas: alternam só enquanto anda
    let legA = "", legB = "";
    const step = 0.16;
    const legFrames = [[0, 0]];
    for (const [a, b] of legs) for (let x = a, i = 0; x < b; x += step, i++) legFrames.push([x, i % 2 ? -2 : 0], [Math.min(b, x + step) - 0.001, i % 2 ? -2 : 0]);
    for (const [x, v] of legFrames) {
      legA += `${pct(x)}{transform:translateY(${v}px)}`;
      legB += `${pct(x)}{transform:translateY(${v === 0 ? -2 : 0}px)}`;
    }
    legA += `100%{transform:translateY(0)}`;
    legB += `100%{transform:translateY(0)}`;
    // z-fighting: a parede pisca por cima do jogador durante a travessia
    let wallKf = "0%{opacity:0}";
    let rnd = 7;
    const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
    for (const [a, b] of glitch) for (let x = a; x < b; x += 0.07) wallKf += `${pct(x)}{opacity:${rand() > 0.5 ? 1 : 0}}`;
    wallKf += `${pct(glitch.at(-1)[1] + 0.01)}{opacity:0}100%{opacity:0}`;

    // sprite do Pedro (mesmo do site)
    const sprite = `
      <g class="la"><rect x="-5" y="-12" width="4" height="10" fill="#34404f"/><rect x="-5" y="-2" width="5" height="2" fill="#0b0d10"/></g>
      <g class="lb"><rect x="1" y="-12" width="4" height="10" fill="#34404f"/><rect x="1" y="-2" width="5" height="2" fill="#0b0d10"/></g>
      <rect x="-9" y="-27" width="3" height="6" fill="#111215"/><rect x="-9" y="-21" width="3" height="7" fill="#c99a7b"/>
      <rect x="-6" y="-28" width="12" height="17" fill="#1f2228" stroke="#2f343c" stroke-width="0.6"/>
      <rect x="-2" y="-28" width="5" height="2" fill="#2a2d33"/><rect x="0" y="-28" width="2" height="2" fill="#e0b394"/>
      <rect x="6" y="-27" width="3" height="6" fill="#111215"/><rect x="6" y="-21" width="3" height="7" fill="#e0b394"/>
      <rect x="-1" y="-30" width="4" height="2" fill="#e0b394"/><rect x="-5" y="-40" width="11" height="10" fill="#e0b394"/>
      <rect x="-6" y="-36" width="2" height="3" fill="#c99a7b"/>
      <g fill="#1d1714"><rect x="-6" y="-43" width="12" height="4"/><rect x="-7" y="-41" width="3" height="6"/><rect x="-5" y="-45" width="3" height="2"/><rect x="-1" y="-46" width="4" height="3"/><rect x="4" y="-44" width="3" height="3"/><rect x="5" y="-41" width="2" height="2"/><rect x="1" y="-37" width="4" height="1"/><rect x="3" y="-35" width="2" height="2"/><rect x="1" y="-32" width="5" height="1"/><rect x="0" y="-31" width="2" height="2"/><rect x="2" y="-30" width="4" height="2"/></g>`;

    const [dx0, dy0] = P(...DESK);
    const code = [[4.1, 4.75, 1.56], [4.18, 4.95, 1.46], [4.18, 4.6, 1.36], [4.1, 4.85, 1.26], [4.18, 4.5, 1.16]]
      .map(([a, b, z], i) => {
        const [x1, y1] = P(a, 0.47, z), [x2, y2] = P(b, 0.47, z);
        const len = Math.hypot(x2 - x1, y2 - y1).toFixed(1);
        return `<line class="code" style="--l:${len};animation-delay:${i * 0.45}s" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${i % 2 ? C.rust : C.teal}" stroke-width="2.2" stroke-dasharray="${len}" stroke-dashoffset="${len}"/>`;
      })
      .join("");

    // terminal: quatro linhas que se revezam sendo "digitadas"
    const lines = L.lines;
    const TY = 372;
    const term = lines
      .map(([k, v], i) => {
        const full = `${k} → ${v}`;
        const w = measure("mono", 19, `$ ${full}`) + 12;
        return `<g class="tl" style="animation-delay:${-((16 - i * 4) % 16)}s">
          ${t("mono", 64, TY, 19, "$", `fill="${C.dim}"`)}
          ${t("mono", 64 + measure("mono", 19, "$ "), TY, 19, k, `fill="${C.teal}"`)}
          ${t("mono", 64 + measure("mono", 19, `$ ${k} `), TY, 19, `→ ${v}`, `fill="${C.text}"`)}
          <rect class="cov" x="60" y="${TY - 22}" width="${w}" height="32" fill="${C.bg1}" style="--w:${w}px"/>
        </g>`;
      })
      .join("");

    const nameW = measure("serif", 112, "Felipe");
    const dotX = 60 + nameW + 4, dotS = 17;

    const body = `
      <defs>${CHECKER}
        <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#1c242e"/></pattern>
        <linearGradient id="glow" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.teal}" stop-opacity=".35"/><stop offset="1" stop-color="${C.teal}" stop-opacity="0"/></linearGradient>
        <radialGradient id="vig" cx=".75" cy=".1" r=".9"><stop offset="0" stop-color="${C.teal}" stop-opacity=".09"/><stop offset="1" stop-color="${C.teal}" stop-opacity="0"/></radialGradient>
        <clipPath id="clip"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="15"/></clipPath>
      </defs>
      ${frame(W, H)}
      <g clip-path="url(#clip)">
        <rect x="640" y="46" width="560" height="${H - 46}" fill="url(#dots)"/>
        <line x1="0" y1="46" x2="${W}" y2="46" stroke="${C.line}"/>
      </g>

      <!-- barra superior -->
      <rect x="24" y="17" width="12" height="12" fill="url(#mt)"/>
      ${t("monoM", 46, 28, 14, "pdrflp0", `fill="${C.text}"`)}
      ${t("mono", 46 + measure("monoM", 14, "pdrflp0"), 28, 14, "/prod", `fill="${C.dim}"`)}
      <circle class="pulse" cx="214" cy="23" r="4" fill="${C.ok}"/>
      ${t("mono", 226, 28, 14, L.nominal, `fill="${C.dim}"`)}
      ${t("mono", W - 24, 28, 14, "pdrflp.vercel.app ↗", `fill="${C.teal}" text-anchor="end"`)}

      <!-- nome -->
      ${t("mono", 64, 104, 15, L.kicker, `fill="${C.dim}" letter-spacing="1.6"`)}
      ${t("serif", 58, 210, 112, "Pedro", `fill="${C.text}" letter-spacing="-3"`)}
      ${t("serif", 58, 308, 112, "Felipe", `fill="${C.text}" letter-spacing="-3"`)}
      <rect x="${dotX - 12}" y="${308 - dotS}" width="${dotS}" height="${dotS}" fill="${C.text}"/>
      <rect class="zf" x="${dotX - 12}" y="${308 - dotS}" width="${dotS}" height="${dotS}" fill="url(#mt)"/>

      <!-- terminal -->
      <line x1="64" y1="336" x2="600" y2="336" stroke="${C.line}"/>
      ${term}
      <rect class="caret" x="64" y="392" width="10" height="3" fill="${C.pink}"/>
      ${t("mono", 64, 432, 14, "Java · Spring Boot · TypeScript · NestJS · PostgreSQL", `fill="${C.dim}"`)}

      <!-- mapa isométrico -->
      <polygon points="${pts([0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0])}" fill="#0f141b" stroke="#2b3440"/>
      <g stroke="#1a222c">${grid}</g>
      <polygon points="${pts([0, 0, 0], [0, N, 0], [0, N, HW], [0, 0, HW])}" fill="#121821" stroke="#2b3440"/>
      <polygon points="${pts([0, 0, 0], [N, 0, 0], [N, 0, HW], [0, 0, HW])}" fill="#161d27" stroke="#2b3440"/>
      <g stroke="#1d2631">${seams}</g>
      <polyline points="${pts([0, N, HW], [0, 0, HW], [N, 0, HW])}" fill="none" stroke="#3a4655" stroke-width="1.4"/>
      <polygon class="zs" points="${pts([0, 2, 0], [0, 3, 0], [0, 3, 1.25], [0, 2, 1.25])}" fill="url(#mt)"/>
      <polygon points="${pts([1.2, 0, 1.15], [2.6, 0, 1.15], [2.6, 0, 2.05], [1.2, 0, 2.05])}" fill="#1f3340" stroke="#2b3440"/>
      ${box([0, 4.5, 0], [1.1, 1.1, 1.1], ["#1e2630", "#141a22", "#19212b"])}
      ${box([0, 4.75, 1.1], [0.7, 0.7, 0.55], ["#1e2630", "#141a22", "#19212b"])}
      ${box([3.3, 0, 0], [2.3, 1.15, 0.9], ["#1e2630", "#141a22", "#19212b"])}
      ${box([3.9, 0.15, 0.9], [1.25, 0.3, 0.85], ["#2a313b", "#0b0e12", "#1b2129"])}
      <polygon points="${pts([4.0, 0.46, 1.0], [5.05, 0.46, 1.0], [5.05, 0.46, 1.66], [4.0, 0.46, 1.66])}" fill="#05070a"/>
      ${code}
      <polygon points="${pts([4.0, 0.46, 0.905], [5.05, 0.46, 0.905], [5.05, 1.15, 0.905], [4.0, 1.15, 0.905])}" fill="url(#glow)"/>
      ${box([4.05, 0.62, 0.9], [0.95, 0.32, 0.04], ["#2a313b", "#141a22", "#19212b"])}
      <g class="pl" transform="translate(${dx0.toFixed(1)} ${dy0.toFixed(1)})">
        <ellipse cx="0" cy="0" rx="9" ry="4.5" fill="#000" opacity=".45"/>
        <g shape-rendering="crispEdges">${sprite}</g>
      </g>
      <g class="ov" opacity="0">
        <polygon points="${pts([0, 1.6, 0], [0, 3.4, 0], [0, 3.4, HW], [0, 1.6, HW])}" fill="#121821"/>
        <polygon points="${pts([0, 2, 0], [0, 3, 0], [0, 3, 1.25], [0, 2, 1.25])}" fill="url(#mt)"/>
      </g>
      ${t("mono", W - 24, H - 22, 12, L.fig, `fill="#4d5866" text-anchor="end"`)}
      <rect width="${W}" height="${H}" fill="url(#vig)" clip-path="url(#clip)" pointer-events="none"/>
    `;

    const css = `
      .pulse{animation:pulse 1.8s ease-out infinite;transform-origin:214px 23px}
      @keyframes pulse{0%{opacity:1}70%{opacity:.35}100%{opacity:1}}
      .zf{animation:zf 4.2s steps(1) infinite}
      @keyframes zf{0%,86%,100%{opacity:0}87%{opacity:1;transform:translate(1px,0)}88%{opacity:.2}89%{opacity:1;transform:translate(0,1px)}90%{opacity:0}94%{opacity:.9;transform:translate(-1px,0)}95%{opacity:0}}
      .zs{animation:zs 3.1s steps(1) infinite}
      @keyframes zs{0%,62%,70%,100%{opacity:1}63%{opacity:0}64%{opacity:1}65%{opacity:.1}71%,74%{opacity:0}72%{opacity:1}}
      .tl{animation:tl 16s linear infinite}
      @keyframes tl{0%,23.5%{opacity:1}24%,100%{opacity:0}}
      .cov{animation:cov 16s steps(28) infinite}
      @keyframes cov{0%{transform:translateX(0)}8%,100%{transform:translateX(var(--w))}}
      .caret{animation:caret 1s steps(1) infinite}
      @keyframes caret{50%{opacity:0}}
      .code{animation:code 5.4s steps(8) infinite}
      @keyframes code{0%{stroke-dashoffset:var(--l)}20%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:0;opacity:0}}
      .pl{animation:pl ${TOTAL.toFixed(2)}s linear infinite}
      @keyframes pl{${kf}}
      .la{animation:la ${TOTAL.toFixed(2)}s steps(1) infinite}
      .lb{animation:lb ${TOTAL.toFixed(2)}s steps(1) infinite}
      @keyframes la{${legA}}
      @keyframes lb{${legB}}
      .ov{animation:ov ${TOTAL.toFixed(2)}s steps(1) infinite}
      @keyframes ov{${wallKf}}
      @media (prefers-reduced-motion:reduce){.cov{display:none}.tl~.tl{display:none}}
    `;
    return { body, css };
  });
}

/* ——— cards de projeto ——— */
const STATUS = {
  ok: { color: C.ok, pulse: true },
  build: { color: C.warn, pulse: true },
  done: { color: C.teal, pulse: false },
  arcade: { color: C.pink, pulse: true },
};

const tr = (v, lang) => (v && typeof v === "object" && !Array.isArray(v) ? v[lang] : v);

async function card(raw, lang) {
  const p = {
    ...raw,
    tier: tr(raw.tier, lang), name: tr(raw.name, lang), sub: tr(raw.sub, lang), desc: tr(raw.desc, lang),
    status: [raw.status[0], tr(raw.status[1], lang)],
    metrics: raw.metrics?.map(([v, l]) => [v, tr(l, lang)]),
  };
  const sizes = { wide: [1200, 260], half: [600, 300], small: [400, 250] };
  const [W, H] = sizes[p.size];
  const PAD = p.size === "small" ? 26 : 32;
  await build(`card-${p.id}${lang === "pt" ? "-pt" : ""}`, W, H, (t) => {
    const st = STATUS[p.status[0]];
    const nameSize = p.size === "wide" ? 50 : p.size === "half" ? 40 : 32;
    const descSize = p.size === "small" ? 15.5 : 17;
    const descMax = p.size === "wide" ? 640 : W - PAD * 2;
    const all = wrap("sans", descSize, p.desc, descMax);
    const desc = all.slice(0, p.size === "small" ? 3 : 2);
    if (all.length > desc.length) console.warn(`  ⚠ ${p.id} (${lang}): descrição cortada (${all.length} linhas)`);

    let y = PAD + 14;
    let body = frame(W, H);
    // tier + status
    const tierW = measure("monoM", 12, p.tier) + 18;
    body += `<rect x="${PAD}" y="${y - 13}" width="${tierW}" height="22" rx="11" fill="none" stroke="${p.tierColor ?? C.rust}"/>`;
    body += t("monoM", PAD + 9, y + 2.5, 12, p.tier, `fill="${p.tierColor ?? C.rust}" letter-spacing=".4"`);
    const sx = W - PAD;
    body += t("mono", sx, y + 3, 13, p.status[1], `fill="${C.dim}" text-anchor="end"`);
    const dotX = sx - measure("mono", 13, p.status[1]) - 12;
    body += p.status[0] === "arcade"
      ? `<rect class="${st.pulse ? "pulse" : ""}" x="${dotX - 5}" y="${y - 6}" width="10" height="10" fill="url(#mt)"/>`
      : `<circle class="${st.pulse ? "pulse" : ""}" cx="${dotX}" cy="${y - 1}" r="5" fill="${st.color}"/>`;

    // nome e descrição
    y += p.size === "wide" ? 62 : 54;
    body += t("serif", PAD - 2, y, nameSize, p.name, `fill="${C.text}" letter-spacing="-1"`);
    if (p.sub) body += t("mono", PAD + measure("serif", nameSize, p.name) + 10, y - 4, 13, p.sub, `fill="${C.dim}"`);
    y += p.size === "wide" ? 34 : 30;
    desc.forEach((line, i) => (body += t("sans", PAD, y + i * (descSize * 1.42), descSize, line, `fill="#b9c2cc"`)));
    y += desc.length * descSize * 1.42 + 8;

    // chips da stack
    let cx = PAD;
    const chipY = p.size === "wide" ? H - 76 : H - (p.events ? 82 : 46);
    for (const s of p.stack) {
      const w = measure("mono", 12.5, s) + 18;
      if (cx + w > (p.size === "wide" ? 700 : W - PAD)) break;
      body += `<rect x="${cx}" y="${chipY}" width="${w}" height="24" rx="12" fill="${C.bg2}" stroke="${C.line}"/>`;
      body += t("mono", cx + 9, chipY + 16.5, 12.5, s, `fill="#c4ccd5"`);
      cx += w + 7;
    }

    // métricas (cards largos: bloco à direita)
    if (p.size === "wide" && p.metrics) {
      const mx = 760, mw = (W - PAD - mx) / 2;
      p.metrics.slice(0, 4).forEach(([v, l], i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = mx + col * mw, yy = 92 + row * 68;
        body += `<line x1="${x}" y1="${yy - 30}" x2="${x}" y2="${yy + 18}" stroke="${C.line}"/>`;
        body += t("serif", x + 16, yy, 40, v, `fill="${C.text}"`);
        body += t("mono", x + 16, yy + 18, 12, l, `fill="${C.dim}"`);
      });
    } else if (p.metrics) {
      const line = p.metrics.map(([v, l]) => `${v} ${l}`).join(" · ");
      body += t("mono", PAD, chipY - 14, 12.5, line, `fill="${C.teal}"`);
    }

    // fluxo de eventos rolando no rodapé
    let css = `.pulse{animation:pulse 1.8s ease-out infinite}@keyframes pulse{0%{opacity:1}70%{opacity:.3}100%{opacity:1}}`;
    if (p.events) {
      const ey = H - 26;
      const seq = p.events.join("  →  ") + "  →  ";
      const seqW = measure("mono", 12.5, seq);
      body += `<line x1="${PAD}" y1="${ey - 20}" x2="${W - PAD}" y2="${ey - 20}" stroke="${C.line}"/>`;
      body += `<g clip-path="url(#tick)"><g class="tick">${t("mono", PAD, ey, 12.5, seq + seq + seq, `fill="${C.dim}"`)}</g></g>`;
      body += `<rect x="${PAD}" y="${ey - 16}" width="40" height="22" fill="url(#fadeL)"/><rect x="${W - PAD - 40}" y="${ey - 16}" width="40" height="22" fill="url(#fadeR)"/>`;
      css += `.tick{animation:tick ${(seqW / 38).toFixed(1)}s linear infinite}@keyframes tick{to{transform:translateX(-${seqW.toFixed(1)}px)}}`;
      body = `<defs>${CHECKER}<clipPath id="tick"><rect x="${PAD}" y="${ey - 18}" width="${W - PAD * 2}" height="26"/></clipPath>
        <linearGradient id="fadeL"><stop offset="0" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg1}" stop-opacity="0"/></linearGradient>
        <linearGradient id="fadeR"><stop offset="0" stop-color="${C.bg1}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg1}"/></linearGradient></defs>` + body;
    } else {
      body = `<defs>${CHECKER}</defs>` + body;
    }
    return { body, css };
  });
}

/* ——— stack.yml ——— */
async function stack() {
  const rows = [
    ["languages", ["Java", "TypeScript", "SQL", "JavaScript"]],
    ["backend", ["Spring Boot", "JPA/Hibernate", "NestJS", "Node.js", "Bun", "MikroORM"]],
    ["data", ["PostgreSQL", "Firebase"]],
    ["distributed", ["idempotency", "pessimistic locking", "Outbox/Inbox", "AWS SQS", "DDD"]],
    ["testing", ["JUnit", "Mockito", "Vitest", "Playwright"]],
    ["delivery", ["Docker", "GitHub Actions", "Maven", "Git/GitFlow", "Vercel"]],
    ["frontend", ["React", "Next.js", "React Native", "GSAP"]],
  ];
  const W = 1200, LH = 34, H = 70 + rows.length * LH + 30;
  await build("stack", W, H, (t) => {
    let body = `<defs>${CHECKER}</defs>${frame(W, H)}`;
    body += `<line x1="2" y1="46" x2="${W - 2}" y2="46" stroke="${C.line}"/>`;
    body += `<rect x="24" y="17" width="12" height="12" fill="url(#mt)"/>`;
    body += t("mono", 46, 28, 14, "~/stack.yml", `fill="${C.dim}"`);
    body += t("mono", W - 24, 28, 14, "yaml · utf-8", `fill="#4d5866" text-anchor="end"`);
    rows.forEach(([k, vals], i) => {
      const y = 88 + i * LH;
      body += t("mono", 30, y, 15, String(i + 1).padStart(2, " "), `fill="#3b4552"`);
      body += t("mono", 74, y, 17, `${k}:`, `fill="${C.teal}"`);
      let x = 250;
      body += t("mono", x, y, 17, "[", `fill="${C.dim}"`);
      x += measure("mono", 17, "[");
      vals.forEach((v, j) => {
        const isRust = k === "distributed";
        body += t("mono", x, y, 17, v, `fill="${isRust ? C.rust : C.text}"`);
        x += measure("mono", 17, v);
        body += t("mono", x, y, 17, j < vals.length - 1 ? "," : "]", `fill="${C.dim}"`);
        x += measure("mono", 17, j < vals.length - 1 ? ", " : "]");
      });
    });
    const ly = 88 + rows.length * LH;
    body += t("mono", 30, ly, 15, String(rows.length + 1).padStart(2, " "), `fill="#3b4552"`);
    body += `<rect class="caret" x="74" y="${ly - 15}" width="10" height="19" fill="${C.pink}"/>`;
    return { body, css: `.caret{animation:caret 1s steps(1) infinite}@keyframes caret{50%{opacity:0}}` };
  });
}

/* ——— rodapé ——— */
async function footer() {
  const W = 1200, H = 96;
  await build("footer", W, H, (t) => {
    const msg = "something on pdrflp.vercel.app isn't rendering right.";
    const w = measure("mono", 17, msg);
    const x = (W - w) / 2 + 14;
    let body = `<defs>${CHECKER}</defs>${frame(W, H)}`;
    body += `<rect class="zf" x="${x - 30}" y="38" width="14" height="14" fill="url(#mt)"/>`;
    body += `<g class="rgb">${t("mono", x, 51, 17, msg, `fill="${C.text}"`)}</g>`;
    body += t("mono", W / 2, 78, 13, "> noclip", `fill="${C.teal}" text-anchor="middle"`);
    const css = `.zf{animation:zf 3.4s steps(1) infinite}@keyframes zf{0%,60%,100%{opacity:1}61%{opacity:0}62%{opacity:1}63%{opacity:.2}64%{opacity:1}}
      .rgb{animation:rgb 5s steps(1) infinite}@keyframes rgb{0%,91%,100%{transform:none;filter:none}92%{transform:translateX(2px);filter:drop-shadow(-2px 0 #ff005a) drop-shadow(2px 0 #00d2ff)}93%{transform:translateX(-1px)}94%{transform:none;filter:none}}`;
    return { body, css };
  });
}

/* ——— projetos, do mais pesado ao mais leve ——— */
const T0 = { en: "TIER 0 · FLAGSHIP", pt: "TIER 0 · CARRO-CHEFE" };
const T1 = { en: "TIER 1 · CORE", pt: "TIER 1 · PRINCIPAIS" };
const PROJECTS = [
  {
    id: "residuo", size: "wide", tier: T0, status: ["ok", { en: "ci passing", pt: "ci passando" }],
    name: "Resíduo", sub: { en: "open source", pt: "código aberto" },
    desc: {
      en: "A lab that reproduces, against a real service, how a deleted record comes back — stale offline updates, redeliveries and upserts — and proves it with evidence.",
      pt: "Laboratório que reproduz, contra um serviço real, como um registro apagado volta — edições offline atrasadas, reentregas e upserts — e prova isso com evidência.",
    },
    stack: ["TypeScript", "NestJS", "React", "PostgreSQL", "Playwright"],
    metrics: [["4", { en: "scenarios", pt: "cenários" }], ["2", { en: "modes: broken / fixed", pt: "modos: com bug / corrigido" }], ["360", { en: "delivery orders explored", pt: "ordens de entrega exploradas" }], ["0", { en: "sleeps — barriers only", pt: "sleeps — só barreiras" }]],
    events: ["create g1", "hold update", "DELETE item-17", "confirm 404", "release update", "upsert", "200 g1 · VIOLATION", "guarded: 409 REJECTED_DELETED"],
  },
  {
    id: "wagering", size: "wide", tier: T0, status: ["ok", { en: "297 tests", pt: "297 testes" }],
    name: "Distributed Wagering Processor", sub: "",
    desc: {
      en: "Wagering transactions over HTTP and SQS FIFO, built solo: the balance never goes negative, the ledger is immutable, and races are proven with real OS processes.",
      pt: "Apostas via HTTP e SQS FIFO, feito sozinho: saldo nunca negativo, ledger imutável e corridas provadas com processos reais do sistema operacional.",
    },
    stack: ["NestJS", "Bun", "PostgreSQL", "AWS SQS", "Docker"],
    metrics: [["297", { en: "tests", pt: "testes" }], ["14k", { en: "lines of TypeScript", pt: "linhas de TypeScript" }], ["3", { en: "OS processes racing", pt: "processos do SO na corrida" }], ["14", { en: "schema guards verified", pt: "travas no schema verificadas" }]],
    events: ["POST /wagering/transactions", "Idempotency-Key ✓", "SELECT … FOR UPDATE", "BET 80.00", "ledger.append", "outbox.publish", "422 INSUFFICIENT_FUNDS"],
  },
  {
    id: "portfolio", size: "half", tier: T1, status: ["ok", { en: "live", pt: "no ar" }],
    name: { en: "Portfolio", pt: "Portfólio" },
    desc: {
      en: "On the surface, a portfolio. Inside, a production-style system view: Jaeger-like trace of the visit, case studies and a bug journal.",
      pt: "Por fora, um portfólio. Por dentro, um painel de produção: trace estilo Jaeger, estudos de caso e diário de bugs.",
    },
    stack: ["Next.js", "TypeScript", "GSAP"], metrics: [["100", "Lighthouse"], ["4", { en: "post-mortems", pt: "post-mortems" }]],
    events: ["noclip on", "GET /api/trace 200", "boot", "achievement unlocked", "Any% split"],
  },
  {
    id: "eletra", size: "half", tier: T1, status: ["done", { en: "shipped 2024", pt: "entregue 2024" }],
    name: { en: "Energy Meter Catalog", pt: "Catálogo de Medidores" },
    desc: {
      en: "Built during my scholarship at Eletra Energy Solutions: a Spring Boot REST API plus a JavaFX desktop client.",
      pt: "Feito na minha bolsa na Eletra Energy Solutions: uma API REST em Spring Boot e um cliente desktop em JavaFX.",
    },
    stack: ["Java 8", "Spring Boot", "JPA", "JavaFX"], metrics: [["15", "endpoints"], ["3", { en: "resources", pt: "recursos" }]],
    events: ["GET /api/lines", "GET /api/categories/{line}", "POST /api/models", "201 Created"],
  },
  {
    id: "minha-cidade", size: "half", tier: T1, status: ["done", { en: "team project", pt: "projeto em equipe" }],
    name: "Minha Cidade, Minha Rua",
    desc: {
      en: "Mobile app to report urban issues in Fortaleza: real-time Firestore, photo upload and an offline sync queue.",
      pt: "App para registrar problemas urbanos de Fortaleza: Firestore em tempo real, upload de fotos e fila offline.",
    },
    stack: ["React Native", "Expo", "Firebase"], metrics: [["3", { en: "Firebase services", pt: "serviços Firebase" }], ["offline", { en: "first", pt: "primeiro" }]],
    events: ["report.queued", "netinfo.online", "queue.flush", "storage.upload", "onSnapshot"],
  },
  {
    id: "commerceops", size: "half", tier: T1, tierColor: C.warn, status: ["build", { en: "building", pt: "em construção" }],
    name: "CommerceOps API",
    desc: {
      en: "E-commerce products, inventory and orders with role-based access. Just started — Java 21 and Spring Boot 4 from the ground up.",
      pt: "Produtos, estoque e pedidos de e-commerce com controle de acesso por papel. Recém-começado — Java 21 e Spring Boot 4 do zero.",
    },
    stack: ["Java 21", "Spring Boot 4", "PostgreSQL", "Flyway"], metrics: [["v1", { en: "in progress", pt: "em andamento" }]],
    events: ["GET /actuator/health", "200 UP", "next: catalog", "next: inventory", "next: orders"],
  },
  {
    id: "unitreino", size: "small", tier: "TIER 2", tierColor: C.dim, status: ["done", { en: "shipped", pt: "entregue" }],
    name: { en: "Email service", pt: "Serviço de e-mail" },
    desc: { en: "Email microservice for UNI-Treino, a team training assistant for UNIFOR students.", pt: "Microsserviço de e-mail do UNI-Treino, assistente de treino feito em equipe para alunos da UNIFOR." },
    stack: ["Node.js", "Express"],
  },
  {
    id: "shape", size: "small", tier: "TIER 2", tierColor: C.dim, status: ["ok", { en: "in daily use", pt: "uso diário" }],
    name: "Shape 2026",
    desc: { en: "My personal training PWA: progressive overload, rest timer and diet. 100% offline, IndexedDB.", pt: "Meu PWA de treino: progressão de carga, timer de descanso e dieta. 100% offline, IndexedDB." },
    stack: ["PWA", "JavaScript"],
  },
  {
    id: "invaders", size: "small", tier: "TIER 2", tierColor: C.dim, status: ["arcade", "arcade"],
    name: "Space Invaders",
    desc: { en: "The classic, rebuilt in Godot: alien waves, lives and scoring.", pt: "O clássico refeito em Godot: ondas de aliens, vidas e pontuação." },
    stack: ["Godot", "GDScript"],
  },
];


/* ——— a queda: do mapa do README para a dimensão do portfólio ——— */
const CODE = [
  // linhas reais: Resíduo (consumidor), Wagering (migrations/workers) e a API da Eletra
  ["ON CONFLICT (ns, id) DO UPDATE", "residuo"],
  ["RETURNING id, generation, revision, (xmax = 0) AS inserted", "residuo"],
  ["INSERT INTO inbox (ns, delivery_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", "residuo"],
  ["SELECT 1 FROM identities WHERE ns = $1 AND id = $2 FOR UPDATE", "residuo"],
  ["outcome: 'REJECTED_DELETED'", "residuo"],
  ["CONSTRAINT wallets_balance_non_negative CHECK (balance_amount >= 0)", "wagering"],
  ["CREATE OR REPLACE FUNCTION prevent_ledger_mutation() RETURNS TRIGGER", "wagering"],
  ["FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();", "wagering"],
  ["... FOR UPDATE SKIP LOCKED", "wagering"],
  ["result_balance_amount IS NULL OR result_balance_amount >= 0", "wagering"],
  ["@RestController", "eletra"],
  ["@GetMapping(\"/models/{category-name}\")", "eletra"],
  ["List<ModelEntity> findByCategoryId(Short categoryId);", "eletra"],
  ["@ManyToOne", "eletra"],
];

const FT = {
  en: { path: "~/fall", depth: "z: -4.5 → -∞", into: "entering: portfolio dimension", cta: "respawn → pdrflp.vercel.app", note: "the player fell off the map. this is where he lands." },
  pt: { path: "~/queda", depth: "z: -4.5 → -∞", into: "entrando: dimensão do portfólio", cta: "respawn → pdrflp.vercel.app", note: "o jogador caiu do mapa. é aqui que ele aterrissa." },
};

async function fall(lang) {
  const W = 1200, H = 540, L = FT[lang];
  await build(lang === "en" ? "fall" : "fall-pt", W, H, (t) => {
    const top = 48, bottom = 360;
    const colX = [40, 628];
    let cols = "";
    colX.forEach((x0, ci) => {
      const lines = CODE.filter((_, i) => i % 2 === ci).concat(CODE.filter((_, i) => i % 2 !== ci));
      const LH = 27;
      const block = lines.length * LH;
      let g = "";
      for (let rep = 0; rep < 3; rep++)
        lines.forEach(([code, src], i) => {
          const y = top + 30 + rep * block + i * LH;
          const hot = /FOR UPDATE|REJECTED_DELETED|>= 0|prevent_ledger_mutation\(\) RETURNS/.test(code);
          g += t("mono", x0, y, 12.5, code, `fill="${hot ? "#3d6370" : "#273039"}"`);
        });
      cols += `<g class="col" style="--b:${block}px;animation-duration:${ci ? 9 : 7}s">${g}</g>`;
    });

    // traços de velocidade passando pelo jogador
    let streaks = "";
    for (let i = 0; i < 9; i++) {
      const x = 560 + ((i * 37) % 80), len = 30 + ((i * 53) % 50), d = (i * 0.17).toFixed(2);
      streaks += `<line class="streak" x1="${x}" y1="${bottom}" x2="${x}" y2="${bottom - len}" stroke="${C.teal}" stroke-opacity=".35" stroke-width="1.5" style="animation-delay:-${d}s"/>`;
    }

    // jogador caindo (braços para cima)
    const sprite = `
      <rect x="-5" y="-12" width="4" height="10" fill="#34404f"/><rect x="-5" y="-2" width="5" height="2" fill="#0b0d10"/>
      <rect x="1" y="-12" width="4" height="10" fill="#34404f"/><rect x="1" y="-2" width="5" height="2" fill="#0b0d10"/>
      <rect x="-9" y="-44" width="3" height="7" fill="#e0b394"/><rect x="-9" y="-37" width="3" height="9" fill="#111215"/>
      <rect x="6" y="-44" width="3" height="7" fill="#e0b394"/><rect x="6" y="-37" width="3" height="9" fill="#111215"/>
      <rect x="-6" y="-28" width="12" height="17" fill="#1f2228" stroke="#2f343c" stroke-width="0.6"/>
      <rect x="-2" y="-28" width="5" height="2" fill="#2a2d33"/><rect x="0" y="-28" width="2" height="2" fill="#e0b394"/>
      <rect x="-1" y="-30" width="4" height="2" fill="#e0b394"/><rect x="-5" y="-40" width="11" height="10" fill="#e0b394"/>
      <g fill="#1d1714"><rect x="-6" y="-43" width="12" height="4"/><rect x="-7" y="-41" width="3" height="6"/><rect x="-5" y="-45" width="3" height="2"/><rect x="-1" y="-46" width="4" height="3"/><rect x="4" y="-44" width="3" height="3"/><rect x="1" y="-37" width="4" height="1"/><rect x="3" y="-35" width="2" height="2"/><rect x="1" y="-32" width="5" height="1"/><rect x="0" y="-31" width="2" height="2"/><rect x="2" y="-30" width="4" height="2"/></g>`;

    const px = 600, portalY = 418;
    const body = `
      <defs>${CHECKER}
        <clipPath id="shaft"><rect x="2" y="${top}" width="${W - 4}" height="${bottom - top + 20}"/></clipPath>
        <linearGradient id="fadeT" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg1}" stop-opacity="0"/></linearGradient>
        <linearGradient id="fadeB" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.bg1}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg1}"/></linearGradient>
        <radialGradient id="pglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4fd8" stop-opacity=".35"/><stop offset="1" stop-color="#ff4fd8" stop-opacity="0"/></radialGradient>
      </defs>
      ${frame(W, H)}
      <line x1="2" y1="46" x2="${W - 2}" y2="46" stroke="${C.line}"/>
      <rect x="24" y="17" width="12" height="12" fill="url(#mt)"/>
      ${t("mono", 46, 28, 14, L.path, `fill="${C.dim}"`)}
      ${t("mono", 46 + measure("mono", 14, L.path) + 18, 28, 14, L.depth, `fill="#4d5866"`)}
      ${t("mono", W - 24, 28, 14, L.into, `fill="${C.teal}" text-anchor="end"`)}

      <g clip-path="url(#shaft)">${cols}${streaks}</g>
      <rect x="2" y="${top}" width="${W - 4}" height="44" fill="url(#fadeT)"/>
      <rect x="2" y="${bottom - 40}" width="${W - 4}" height="60" fill="url(#fadeB)"/>

      <!-- o portal -->
      <ellipse class="glow" cx="${px}" cy="${portalY}" rx="230" ry="62" fill="url(#pglow)"/>
      <polygon class="portal" points="${px - 120},${portalY} ${px},${portalY - 34} ${px + 120},${portalY} ${px},${portalY + 34}" fill="url(#mt)" stroke="#ff4fd8" stroke-opacity=".6"/>
      <g class="fall"><g class="wob" shape-rendering="crispEdges">${sprite}</g></g>
      <ellipse class="flash" cx="${px}" cy="${portalY}" rx="120" ry="34" fill="none" stroke="#ff4fd8" stroke-width="2"/>

      ${t("monoM", W / 2, 492, 22, L.cta, `fill="${C.text}" text-anchor="middle"`)}
      ${t("mono", W / 2, 518, 13, L.note, `fill="${C.dim}" text-anchor="middle"`)}
    `;
    const css = `
      .col{animation:col linear infinite}
      @keyframes col{from{transform:translateY(0)}to{transform:translateY(calc(var(--b) * -1))}}
      .streak{animation:streak .45s linear infinite}
      @keyframes streak{from{transform:translateY(40px);opacity:0}30%{opacity:1}to{transform:translateY(-${bottom - top}px);opacity:0}}
      .fall{animation:fall 5s infinite}
      @keyframes fall{
        0%{transform:translate(${px}px,10px) scale(1.4);opacity:0;animation-timing-function:cubic-bezier(.55,0,.9,.6)}
        6%{opacity:1}
        52%{transform:translate(${px}px,${portalY + 6}px) scale(1.4);opacity:1;animation-timing-function:ease-in}
        60%{transform:translate(${px}px,${portalY + 14}px) scale(.2);opacity:0}
        100%{transform:translate(${px}px,${portalY + 14}px) scale(.2);opacity:0}
      }
      .wob{animation:wob .5s ease-in-out infinite alternate}
      @keyframes wob{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
      .portal{animation:portal 5s steps(1) infinite}
      @keyframes portal{0%,50%{opacity:.85}52%{opacity:.3}54%{opacity:1}56%{opacity:.5}58%,100%{opacity:.85}}
      .glow{animation:glow 2.5s ease-in-out infinite alternate}
      @keyframes glow{from{opacity:.55}to{opacity:1}}
      .flash{transform-origin:${px}px ${portalY}px;animation:flash 5s infinite;opacity:0}
      @keyframes flash{0%,53%{transform:scale(.4);opacity:0}55%{opacity:1}70%,100%{transform:scale(1.6);opacity:0}}
      @media (prefers-reduced-motion:reduce){.fall{transform:translate(${px}px,${portalY - 70}px) scale(1.4)}}
    `;
    return { body, css };
  });
}

for (const lang of ["en", "pt"]) {
  await header(lang);
  for (const p of PROJECTS) await card(p, lang);
  await fall(lang);
}
await stack();

// confere se alguma linha de código passa da largura da coluna (588px)
for (const [code] of CODE) if (measure("mono", 12.5, code) > 575) console.warn("  ⚠ linha longa:", code);
