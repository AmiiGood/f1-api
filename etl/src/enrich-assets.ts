import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import sharp from "sharp";
import { parse } from "csv-parse/sync";
import { sqlEscape, slug, sleep } from "./util.js";
import { writeSQL } from "./writers/sql.js";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const DUMP_DIR = join("dump", "csv");
const ASSETS_DIR = join("dump", "assets");
const CACHE_FILE = join("dump", "wikimedia-cache.json");
const BUCKET = "f1-api-assets";

const DRIVER_SIZE = 400;
const CONSTRUCTOR_SIZE = 400;
const CIRCUIT_SIZE = 800;

const USER_AGENT = "SweetCodeF1API/1.0 (https://f1-api.sweetcode.workers.dev; contact@sweetcode.dev)";

type Cache = Record<string, { url: string | null; fetchedAt: string }>;

function loadCache(): Cache {
    if (!existsSync(CACHE_FILE)) return {};
    try {
        return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    } catch {
        return {};
    }
}

function saveCache(cache: Cache) {
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function extractWikiTitle(wikipediaUrl: string | null): string | null {
    if (!wikipediaUrl) return null;
    const match = wikipediaUrl.match(/\/wiki\/([^?#]+)/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
}

async function getWikiImageUrl(title: string, size: number): Promise<string | null> {
    // Intento 1: pageimages de Wikipedia (rápido pero incompleto)
    const api1 = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=${size}&titles=${encodeURIComponent(title)}&redirects=1`;
    const res1 = await fetch(api1, { headers: { "User-Agent": USER_AGENT } });
    if (res1.ok) {
        const data: any = await res1.json();
        const pages = data?.query?.pages ?? {};
        const page = Object.values(pages)[0] as any;
        if (page?.thumbnail?.source) return page.thumbnail.source;
    }

    // Intento 2: Wikidata (P154 logo, P41 flag, P18 imagen)
    // Primero obtén el Q-ID desde Wikipedia
    const api2 = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(title)}&redirects=1`;
    const res2 = await fetch(api2, { headers: { "User-Agent": USER_AGENT } });
    if (!res2.ok) return null;
    const data2: any = await res2.json();
    const pages2 = data2?.query?.pages ?? {};
    const page2 = Object.values(pages2)[0] as any;
    const qid = page2?.pageprops?.wikibase_item;
    if (!qid) return null;

    // Consulta Wikidata por propiedades de imagen
    const api3 = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${qid}&props=claims`;
    const res3 = await fetch(api3, { headers: { "User-Agent": USER_AGENT } });
    if (!res3.ok) return null;
    const data3: any = await res3.json();
    const claims = data3?.entities?.[qid]?.claims ?? {};

    // Prioridad: P154 (logo) → P18 (image) → P41 (flag)
    const props = ["P154", "P18", "P41"];
    let filename: string | null = null;
    for (const p of props) {
        const val = claims[p]?.[0]?.mainsnak?.datavalue?.value;
        if (typeof val === "string") {
            filename = val;
            break;
        }
    }
    if (!filename) return null;

    // Construye URL de Commons con thumbnail
    // File path: primera letra + dos primeras letras del MD5 del nombre con _ en vez de espacios
    const normalized = filename.replace(/ /g, "_");
    const md5 = md5Hex(normalized);
    const isSvg = normalized.toLowerCase().endsWith(".svg");
    const suffix = isSvg ? ".png" : "";
    const url = `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5[0]}${md5[1]}/${encodeURIComponent(normalized)}/${size}px-${encodeURIComponent(normalized)}${suffix}`;
    return url;
}

function md5Hex(str: string): string {
    return createHash("md5").update(str).digest("hex");
}

async function downloadAndOptimize(
    imageUrl: string,
    targetSize: number,
    outputPath: string
): Promise<boolean> {
    const res = await fetch(imageUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());

    await sharp(buffer)
        .resize(targetSize, targetSize, { fit: "cover", position: "centre" })
        .webp({ quality: 85 })
        .toFile(outputPath);

    return true;
}

async function downloadAndOptimizeLandscape(
    imageUrl: string,
    width: number,
    outputPath: string
): Promise<boolean> {
    const res = await fetch(imageUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());

    await sharp(buffer)
        .resize(width, null, { fit: "inside" })
        .webp({ quality: 85 })
        .toFile(outputPath);

    return true;
}

function uploadToR2(localPath: string, key: string): void {
    const abs = resolve(localPath);
    execSync(`wrangler r2 object put ${BUCKET}/${key} --file="${abs}" --remote`, {
        stdio: "pipe",
        cwd: resolve(".."),
    });
}

type Entity = {
    csvFile: string;
    entityType: "driver" | "constructor" | "circuit";
    idCol: string;
    slugCol: string;
    titleCol: string;
    size: number;
    landscape?: boolean;
    r2Prefix: string;
    tableField: string;
    tableName: string;
};

const ENTITIES: Entity[] = [
    {
        csvFile: "formula_one_driver.csv",
        entityType: "driver",
        idCol: "id",
        slugCol: "__slug__",
        titleCol: "wikipedia",
        size: DRIVER_SIZE,
        r2Prefix: "drivers",
        tableField: "image_url",
        tableName: "drivers",
    },
    {
        csvFile: "formula_one_team.csv",
        entityType: "constructor",
        idCol: "id",
        slugCol: "__slug__",
        titleCol: "wikipedia",
        size: CONSTRUCTOR_SIZE,
        r2Prefix: "constructors",
        tableField: "logo_url",
        tableName: "constructors",
    },
    {
        csvFile: "formula_one_circuit.csv",
        entityType: "circuit",
        idCol: "id",
        slugCol: "__slug__",
        titleCol: "wikipedia",
        size: CIRCUIT_SIZE,
        landscape: true,
        r2Prefix: "circuits",
        tableField: "photo_url",
        tableName: "circuits",
    },
];

function readCsv<T = Record<string, string>>(filename: string): T[] {
    const content = readFileSync(join(DUMP_DIR, filename), "utf-8");
    return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true }) as T[];
}

function driverSlugFromRow(row: any): string {
    return slug(`${row.forename} ${row.surname}`) || `driver-${row.id}`;
}
function teamSlugFromRow(row: any): string {
    return slug(row.reference || row.name) || `team-${row.id}`;
}
function circuitSlugFromRow(row: any): string {
    return slug(row.reference || row.name) || `circuit-${row.id}`;
}

async function enrichEntity(ent: Entity, cache: Cache, cdnBase: string) {
    console.log(`\n═══ ${ent.entityType}s ═══`);
    const entityDir = join(ASSETS_DIR, ent.r2Prefix);
    mkdirSync(entityDir, { recursive: true });

    const rows = readCsv<any>(ent.csvFile);
    const sqlLines: string[] = [];
    let hit = 0, miss = 0, fromCache = 0, uploaded = 0, failed = 0;
    const uniqueSlugs = new Set<string>();

    for (const row of rows) {
        let entitySlug: string;
        if (ent.entityType === "driver") entitySlug = driverSlugFromRow(row);
        else if (ent.entityType === "constructor") entitySlug = teamSlugFromRow(row);
        else entitySlug = circuitSlugFromRow(row);

        // constructors y circuits pueden tener slugs repetidos, solo procesamos primera ocurrencia
        const title = extractWikiTitle(row[ent.titleCol]);

        if (!title) { miss++; continue; }

        if (uniqueSlugs.has(entitySlug)) continue;
        uniqueSlugs.add(entitySlug);

        const cacheKey = `${ent.entityType}:${entitySlug}`;
        let imageUrl: string | null;

        if (cache[cacheKey]) {
            imageUrl = cache[cacheKey].url;
            fromCache++;
        } else {
            imageUrl = await getWikiImageUrl(title, ent.size);
            cache[cacheKey] = { url: imageUrl, fetchedAt: new Date().toISOString() };
            await sleep(100); // respetuoso con Wikimedia
        }

        if (!imageUrl) { miss++; continue; }
        hit++;

        const ext = "webp";
        const filename = `${entitySlug}.${ext}`;
        const localPath = join(ASSETS_DIR, ent.r2Prefix, filename);
        const r2Key = `${ent.r2Prefix}/${filename}`;
        const cdnUrl = `${cdnBase}/${r2Key}`;

        if (existsSync(localPath)) {
            // ya descargado antes, solo agrega al SQL
            sqlLines.push(
                `UPDATE ${ent.tableName} SET ${ent.tableField} = ${sqlEscape(cdnUrl)} WHERE id = ${sqlEscape(entitySlug)};`
            );
            continue;
        }

        try {
            const ok = ent.landscape
                ? await downloadAndOptimizeLandscape(imageUrl, ent.size, localPath)
                : await downloadAndOptimize(imageUrl, ent.size, localPath);

            if (!ok) { failed++; continue; }

            console.log(`  ↑ ${r2Key}`);
            uploadToR2(localPath, r2Key);
            uploaded++;

            sqlLines.push(
                `UPDATE ${ent.tableName} SET ${ent.tableField} = ${sqlEscape(cdnUrl)} WHERE id = ${sqlEscape(entitySlug)};`
            );
        } catch (e) {
            console.warn(`  ✗ ${entitySlug}: ${(e as Error).message}`);
            failed++;
        }

        // guarda cache periódicamente
        if ((hit + miss) % 50 === 0) saveCache(cache);
    }

    saveCache(cache);
    console.log(`  hits=${hit} misses=${miss} cached=${fromCache} uploaded=${uploaded} failed=${failed}`);

    return sqlLines;
}

async function main() {
    const cdnBase = process.env.ASSETS_CDN_BASE || "https://f1-api-assets.sweetcode.workers.dev";

    console.log(`Assets CDN base: ${cdnBase}`);
    mkdirSync(ASSETS_DIR, { recursive: true });
    const cache = loadCache();

    const allSql: string[] = [];
    for (const ent of ENTITIES) {
        const lines = await enrichEntity(ent, cache, cdnBase);
        allSql.push(...lines);
    }

    if (allSql.length > 0) {
        await writeSQL("99_assets.sql", allSql.join("\n"));
        console.log(`\n✓ 99_assets.sql (${allSql.length} updates)`);
    } else {
        console.log("\n(no updates generated)");
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});