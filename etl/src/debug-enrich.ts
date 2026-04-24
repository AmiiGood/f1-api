import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { slug } from "./util.js";

const content = readFileSync(join("dump", "csv", "formula_one_team.csv"), "utf-8");
const rows = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true }) as any[];

const cache = JSON.parse(readFileSync(join("dump", "wikimedia-cache.json"), "utf-8"));

const uniqueSlugs = new Set<string>();
let hit = 0, miss = 0;

for (const row of rows) {
    const entitySlug = slug(row.reference || row.name) || `team-${row.id}`;

    if (entitySlug !== "ferrari") continue;

    console.log(`─── Row id=${row.id} slug=${entitySlug} ───`);
    console.log(`  wikipedia: ${row.wikipedia || "(empty)"}`);

    const hasUrl = !!row.wikipedia;
    console.log(`  hasUrl: ${hasUrl}`);

    if (!hasUrl) { miss++; console.log(`  → MISS (no wiki)`); continue; }
    if (uniqueSlugs.has(entitySlug)) { console.log(`  → SKIP (already processed)`); continue; }
    uniqueSlugs.add(entitySlug);

    const cacheEntry = cache[`constructor:${entitySlug}`];
    console.log(`  cache: ${cacheEntry ? JSON.stringify(cacheEntry) : "(not cached)"}`);

    const localPath = join("dump", "assets", "constructors", `${entitySlug}.webp`);
    console.log(`  localPath exists: ${existsSync(localPath)}`);
    hit++;
    console.log(`  → HIT`);
}

console.log(`\nhits=${hit} miss=${miss}`);