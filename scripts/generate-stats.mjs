import { build, measure, C, frame } from "./svg-kit.mjs";

/*
 * Placar do jogador: números reais da API do GitHub, regerados todo dia pelo
 * workflow .github/workflows/stats.yml. Só repositórios públicos e só commits
 * do próprio Pedro (os commits do bot que atualiza este arquivo não entram).
 */
const OUT = process.argv[2];
const LOGIN = "pdrflp0";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error("GITHUB_TOKEN é obrigatório (a API GraphQL não aceita chamadas anônimas)");

const DAY = 86_400_000;
const since = new Date(Date.now() - 365 * DAY).toISOString();

async function gh(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": LOGIN, ...init.headers },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res;
}

const { data } = await (
  await gh("/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: `query($login: String!) { user(login: $login) {
        contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount contributionLevel } } } }
        repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) { nodes { name pushedAt primaryLanguage { name } } }
      } }`,
      variables: { login: LOGIN },
    }),
  })
).json();
const user = data.user;

// commits do Pedro nos últimos 12 meses, repositório por repositório
const repos = [];
for (const repo of user.repositories.nodes) {
  let commits = 0;
  let fixes = 0;
  let url = `/repos/${LOGIN}/${repo.name}/commits?author=${LOGIN}&since=${since}&per_page=100`;
  while (url) {
    const res = await gh(url).catch(() => null); // repositório vazio responde 409
    if (!res) break;
    for (const c of await res.json()) {
      commits++;
      if (/^fix\b/i.test(c.commit.message)) fixes++;
    }
    const next = res.headers.get("link")?.match(/<https:\/\/api\.github\.com([^>]+)>; rel="next"/);
    url = next ? next[1] : null;
  }
  repos.push({ ...repo, commits, fixes });
}

const commits = repos.reduce((n, r) => n + r.commits, 0);
const fixes = repos.reduce((n, r) => n + r.fixes, 0);
const active = repos.filter((r) => r.commits > 0).length;

// linguagens pesadas pelos commits; o repositório do próprio README não conta
const byLang = new Map();
for (const r of repos) {
  if (r.name === LOGIN || !r.commits || !r.primaryLanguage) continue;
  byLang.set(r.primaryLanguage.name, (byLang.get(r.primaryLanguage.name) ?? 0) + r.commits);
}
const langTotal = [...byLang.values()].reduce((a, b) => a + b, 0) || 1;
let langs = [...byLang.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, share: n / langTotal }));
if (langs.length > 4) langs = [...langs.slice(0, 3), { name: "other", share: langs.slice(3).reduce((a, l) => a + l.share, 0) }];

const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
const weeks = user.contributionsCollection.contributionCalendar.weeks.slice(-26);
// sequência atual: se hoje ainda não teve commit, conta a partir de ontem
let streak = 0;
for (let i = days.length - 1 - (days.at(-1).contributionCount ? 0 : 1); i >= 0 && days[i].contributionCount > 0; i--) streak++;
const lastPush = repos.filter((r) => r.name !== LOGIN).sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))[0];
const today = days.at(-1).date;

/* ——— texto ——— */
const T = {
  en: {
    sub: "updated daily from the GitHub API",
    stats: [[commits, "commits", "last 12 months"], [fixes, "bugs squashed", "fix commits · 12 months"], [active, "active repos", "last 12 months"]],
    langs: "languages · 12 months, by commits",
    other: "other",
    map: "explored map · last 26 weeks",
    legend: ["fog: no commits", "explored", "you are here"],
    push: "last push",
    streak: "current streak",
    unit: (n) => (n === 1 ? "day" : "days"),
    locale: "en-US",
  },
  pt: {
    sub: "atualizado todo dia pela API do GitHub",
    stats: [[commits, "commits", "últimos 12 meses"], [fixes, "bugs abatidos", "commits fix · 12 meses"], [active, "repositórios ativos", "últimos 12 meses"]],
    langs: "linguagens · 12 meses, por commits",
    other: "outras",
    map: "mapa explorado · últimas 26 semanas",
    legend: ["névoa: sem commits", "explorado", "você está aqui"],
    push: "último push",
    streak: "sequência atual",
    unit: (n) => (n === 1 ? "dia" : "dias"),
    locale: "pt-BR",
  },
};

const LANG_COLOR = { TypeScript: C.teal, Java: C.rust, JavaScript: C.warn };
const LEVEL = {
  NONE: [C.bg2, 1],
  FIRST_QUARTILE: [C.teal, 0.35],
  SECOND_QUARTILE: [C.teal, 0.6],
  THIRD_QUARTILE: [C.teal, 0.95],
  FOURTH_QUARTILE: [C.pink, 1],
};

const MONTHS = {
  "pt-BR": ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  "en-US": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
// 17 out 2026 / Oct 17, 2026, no fuso de Fortaleza
const fmtDate = (iso, locale) => {
  const [y, m, d] = new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Fortaleza" }).split("-").map(Number);
  const month = MONTHS[locale][m - 1];
  return locale === "pt-BR" ? `${d} ${month} ${y}` : `${month} ${d}, ${y}`;
};

async function stats(lang) {
  const L = T[lang];
  const W = 1200, H = 316, PAD = 32;
  await build(OUT, `stats${lang === "pt" ? "-pt" : ""}`, W, H, (t) => {
    let body = frame(W, H);
    // cabeçalho
    body += `<circle class="pulse" cx="${PAD + 5}" cy="45" r="5" fill="${C.ok}"/>`;
    body += t("monoM", PAD + 18, 50, 13, "player.stats", `fill="${C.text}"`);
    body += t("mono", PAD + 18 + measure("monoM", 13, "player.stats") + 10, 50, 13, `· ${L.sub}`, `fill="${C.dim}"`);
    body += t("mono", W - PAD, 50, 13, fmtDate(`${today}T12:00:00Z`, L.locale), `fill="${C.dim}" text-anchor="end"`);
    body += `<line x1="${PAD}" y1="70" x2="${W - PAD}" y2="70" stroke="${C.line}"/>`;

    // os três números
    L.stats.forEach(([value, label, sub], i) => {
      const x = PAD + i * 200;
      body += `<line x1="${x}" y1="96" x2="${x}" y2="190" stroke="${C.line}"/>`;
      body += `<g class="${i === 1 ? "jit" : ""}">${t("serif", x + 16, 145, 56, String(value), `fill="${i === 1 ? C.pink : C.text}"`)}</g>`;
      body += t("monoM", x + 16, 168, 12.5, label, `fill="#c4ccd5"`);
      body += t("mono", x + 16, 185, 12, sub, `fill="${C.dim}"`);
      if (measure("monoM", 12.5, label) > 180 || measure("mono", 12, sub) > 180) console.warn(`  ⚠ rótulo longo: ${label} / ${sub}`);
    });

    // barra de linguagens
    const BX = PAD, BW = 576, BY = 232;
    body += t("mono", BX, 220, 12, L.langs, `fill="${C.dim}"`);
    body += `<rect x="${BX}" y="${BY}" width="${BW}" height="8" rx="4" fill="${C.bg2}"/>`;
    let x = BX;
    let legend = "";
    let lx = BX;
    langs.forEach((l, i) => {
      const w = Math.max(3, l.share * BW);
      const color = LANG_COLOR[l.name] ?? (i % 2 ? "#c4ccd5" : C.dim);
      const name = l.name === "other" ? L.other : l.name;
      body += `<rect class="grow" style="animation-delay:${(i * 0.12).toFixed(2)}s" x="${x.toFixed(1)}" y="${BY}" width="${(w - (i < langs.length - 1 ? 2 : 0)).toFixed(1)}" height="8" rx="${i === 0 ? 4 : 1}" fill="${color}"/>`;
      x += w;
      const label = `${name} ${Math.round(l.share * 100)}%`;
      legend += `<rect x="${lx}" y="${BY + 22}" width="8" height="8" fill="${color}"/>`;
      legend += t("mono", lx + 14, BY + 30, 12, label, `fill="#c4ccd5"`);
      lx += 14 + measure("mono", 12, label) + 22;
    });
    body += legend;

    // rodapé: último push e sequência
    // o SVG junta espaços seguidos, então cada pedaço é um texto posicionado
    const push = `› ${L.push}: ${lastPush.name} · ${fmtDate(lastPush.pushedAt, L.locale)}`;
    body += t("mono", PAD, 292, 12.5, push, `fill="${C.teal}"`);
    if (streak > 0) body += t("mono", PAD + measure("mono", 12.5, push) + 28, 292, 12.5, `› ${L.streak}: ${streak} ${L.unit(streak)}`, `fill="${C.teal}"`);

    // minimapa: cada coluna é uma semana, cada célula um dia
    const MX = 680, MW = W - PAD - MX, pitch = MW / 26, cell = 15, MY = 106;
    body += t("mono", MX, 96, 12, L.map, `fill="${C.dim}"`);
    let cells = "";
    let here = "";
    weeks.forEach((w, wi) => {
      w.contributionDays.forEach((d) => {
        const row = new Date(`${d.date}T12:00:00Z`).getUTCDay();
        const cx = MX + wi * pitch, cy = MY + row * pitch;
        const [fill, op] = LEVEL[d.contributionLevel] ?? LEVEL.NONE;
        cells += `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${cell}" height="${cell}" rx="2" fill="${fill}" opacity="${op}"/>`;
        if (d.date === today) here = `<rect class="blink" x="${(cx - 2.5).toFixed(1)}" y="${(cy - 2.5).toFixed(1)}" width="${cell + 5}" height="${cell + 5}" rx="3" fill="none" stroke="${C.pink}" stroke-width="2"/>`;
      });
    });
    const gridH = 7 * pitch;
    body += `<defs><clipPath id="map"><rect x="${MX - 4}" y="${MY - 4}" width="${MW + 8}" height="${gridH + 8}"/></clipPath>
      <linearGradient id="scanG"><stop offset="0" stop-color="${C.teal}" stop-opacity="0"/><stop offset=".8" stop-color="${C.teal}" stop-opacity=".22"/><stop offset="1" stop-color="${C.teal}" stop-opacity="0"/></linearGradient></defs>`;
    body += cells;
    body += `<g clip-path="url(#map)"><rect class="scan" x="${MX - 60}" y="${MY - 4}" width="60" height="${gridH + 8}" fill="url(#scanG)"/></g>`;
    body += here;

    // legenda do mapa
    const ly = 292; // na mesma linha do rodapé da esquerda
    let gx = MX;
    const swatch = (i, sx) =>
      [
        `<rect x="${sx}" y="${ly - 9}" width="10" height="10" rx="2" fill="${C.bg2}" stroke="${C.line}"/>`,
        `<rect x="${sx}" y="${ly - 9}" width="10" height="10" rx="2" fill="${C.teal}" opacity=".8"/>`,
        `<rect x="${sx}" y="${ly - 10}" width="12" height="12" rx="2" fill="none" stroke="${C.pink}" stroke-width="2"/>`,
      ][i];
    L.legend.forEach((label, i) => {
      body += swatch(i, gx);
      body += t("mono", gx + 17, ly, 12, label, `fill="${C.dim}"`);
      gx += 17 + measure("mono", 12, label) + 20;
    });

    const css = `
      .pulse{animation:pulse 1.8s ease-out infinite}@keyframes pulse{0%{opacity:1}70%{opacity:.3}100%{opacity:1}}
      .blink{animation:blink 1.1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
      .scan{animation:scan 7s linear infinite}@keyframes scan{from{transform:translateX(0)}to{transform:translateX(${(MW + 64).toFixed(0)}px)}}
      .grow{transform-box:fill-box;transform-origin:left;animation:grow 1.2s cubic-bezier(.2,.8,.2,1) both}@keyframes grow{from{transform:scaleX(0)}}
      .jit{animation:jit 6s steps(1) infinite}@keyframes jit{0%,94%{transform:none}95%{transform:translate(3px,0)}96%{transform:translate(-2px,1px)}97%{transform:none}}
    `;
    return { body, css };
  });
}

console.log({ commits, fixes, active, streak, langs, lastPush: lastPush.name });
for (const lang of ["en", "pt"]) await stats(lang);
