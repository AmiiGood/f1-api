# 🏎️ F1 API

A free, developer-friendly **Formula 1 API** with historical data from 1950 to present. Built for learners — clean slug IDs, no auth required, interactive docs, EN/ES content.

🌐 **Live:** [f1api.sweetcode.app](https://f1api.sweetcode.app)
📖 **Docs:** [f1api.sweetcode.app/docs](https://f1api.sweetcode.app/docs)
🖼️ **Assets CDN:** [assets.sweetcode.app](https://assets.sweetcode.app)

---

## Quick start

```bash
# Get all world champions
curl https://f1api.sweetcode.app/v1/champions

# Max Verstappen's career stats
curl https://f1api.sweetcode.app/v1/drivers/max-verstappen/stats

# 2024 Monaco GP results
curl https://f1api.sweetcode.app/v1/races/2024-monaco-gp/results

# Senna vs Prost rivalry (in Spanish)
curl "https://f1api.sweetcode.app/v1/rivalries/senna-vs-prost?lang=es"
```

No API keys. No sign-up. Just fetch.

## Why another F1 API?

Most F1 APIs are either:

- Nested JSON hell (looking at you, Ergast/Jolpica XML-style responses)
- Commercial (Sportmonks, SportRadar)
- Focused on telemetry only (OpenF1)

This one is built for **developers learning to consume APIs** — the Pokémon-API of Formula 1. Flat JSON, slug IDs (`max-verstappen`, not `max_verstappen_1234`), OpenAPI-documented, interactive playground.

## Features

- ✅ **77 seasons** (1950 → present)
- ✅ **879+ drivers**, **214+ constructors**, **78 circuits**
- ✅ **1,173 races** with results and qualifying
- ✅ **Curated rivalries** with key races and significance
- ✅ **Records** — classic (most wins/poles/podiums) and fun (youngest winner, biggest grid-to-win, most different winners in a season)
- ✅ **Bilingual content** EN/ES via `?lang=es`
- ✅ **Images** for drivers, constructors, circuits (served from CDN)
- ✅ **OpenAPI 3.1** spec + **Scalar playground**
- ✅ Auto-updates weekly from [Jolpica-F1](https://jolpi.ca)

## Endpoints overview

| Resource     | Example                                |
| ------------ | -------------------------------------- |
| Seasons      | `/v1/seasons`, `/v1/seasons/2024`      |
| Races        | `/v1/races/2024-italian-gp/results`    |
| Drivers      | `/v1/drivers/lewis-hamilton/stats`     |
| Constructors | `/v1/constructors/ferrari/stats`       |
| Circuits     | `/v1/circuits/monza/races`             |
| Standings    | `/v1/seasons/2021/standings/drivers`   |
| Champions    | `/v1/champions`                        |
| Rivalries    | `/v1/rivalries/hamilton-vs-verstappen` |
| Records      | `/v1/records`, `/v1/records/driver`    |

Full reference at [f1api.sweetcode.app/docs](https://f1api.sweetcode.app/docs).

## Example: build a championship widget

```js
const res = await fetch(
  "https://f1api.sweetcode.app/v1/seasons/2024/standings/drivers",
);
const { data } = await res.json();

data.slice(0, 3).forEach((d, i) => {
  console.log(`P${d.position} · ${d.driverId} · ${d.points} pts`);
});
// P1 · max-verstappen · 437 pts
// P2 · lando-norris · 374 pts
// P3 · charles-leclerc · 356 pts
```

## Rate limits

- **60 requests/minute per IP** on `/v1/*`
- Responses are cached aggressively at the edge — historical data rarely changes
- Please cache on your end too, thanks 🙏

## Stack

- **Runtime:** Cloudflare Workers (edge, global)
- **Framework:** [Hono](https://hono.dev/)
- **Database:** Cloudflare D1 (SQLite)
- **Assets:** Cloudflare R2 + custom Worker CDN
- **Docs:** [Scalar](https://scalar.com/) + OpenAPI 3.1
- **ETL:** TypeScript, runs weekly via GitHub Actions
- **Data source:** [Jolpica-F1 CSV dumps](https://github.com/jolpica/jolpica-f1) (successor to Ergast)

## Self-hosting

You can run your own copy:

```bash
git clone https://github.com/AmiiGood/f1-api.git
cd f1-api
npm install

# Local dev
wrangler dev --local

# ETL (downloads ~13 MB dump from Jolpica, populates DB)
cd etl
npm install
npm run download
npm run etl:dump
npm run etl:enrich
npm run apply:local
```

Deploy to your own Cloudflare account with `wrangler deploy`.

## Data & attribution

Data derived from [Jolpica-F1](https://jolpi.ca), licensed for non-commercial use. Images from Wikipedia / Wikidata (CC-BY-SA).

If you use this API, **a link back is appreciated** ❤️. If you find it useful and want to support the upstream data, consider [donating to Jolpica](https://ko-fi.com/jolpica).

## Contact

Built by **[Sweet Code](https://sweetcode.app)**.

Issues, bugs, or suggestions → [GitHub Issues](https://github.com/AmiiGood/f1-api/issues).

## License

MIT for the code. Data remains under Jolpica's terms.
