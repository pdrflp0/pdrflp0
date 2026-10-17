# Assets do README

Os SVGs animados de `../assets` (cabeçalho, cards, placar, stack e a queda) são gerados por este script, com as fontes do portfólio embutidas só com os glifos usados.

```bash
cd scripts
npm install
npm run fonts   # baixa Instrument Serif, Geist e Geist Mono (OFL) para ./fonts
npm run build   # regera ../assets em inglês e português
GITHUB_TOKEN=$(gh auth token) npm run stats   # regera só o placar (stats.svg e stats-pt.svg)
```

O placar também é regerado todo dia às 06:00 (Fortaleza) pelo workflow `.github/workflows/stats.yml`, com números reais da API do GitHub: commits e commits `fix` dos últimos 12 meses nos repositórios públicos, linguagens e as últimas 26 semanas do gráfico de contribuições. Os commits do bot que atualiza o placar não entram na conta.

Projetos, textos e métricas ficam no array `PROJECTS` de `generate-assets.mjs`.
