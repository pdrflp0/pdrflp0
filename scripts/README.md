# Assets do README

Os SVGs animados de `../assets` (cabeçalho, cards, stack e a queda) são gerados por este script, com as fontes do portfólio embutidas só com os glifos usados.

```bash
cd scripts
npm install
npm run fonts   # baixa Instrument Serif, Geist e Geist Mono (OFL) para ./fonts
npm run build   # regera ../assets em inglês e português
```

Projetos, textos e métricas ficam no array `PROJECTS` de `generate-assets.mjs`.
