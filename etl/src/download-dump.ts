import { createWriteStream, mkdirSync, existsSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execSync } from "node:child_process";
import { join } from "node:path";

const DUMP_URL = "https://api.jolpi.ca/data/dumps/download/delayed/?dump_type=csv";
const DUMP_DIR = "dump";
const ZIP_PATH = join(DUMP_DIR, "jolpica-f1.zip");
const CSV_DIR = join(DUMP_DIR, "csv");

async function main() {
    mkdirSync(DUMP_DIR, { recursive: true });

    console.log(`→ Downloading dump from ${DUMP_URL}`);
    const res = await fetch(DUMP_URL);
    if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status}`);

    await pipeline(Readable.fromWeb(res.body as any), createWriteStream(ZIP_PATH));
    console.log(`  ✓ saved ${ZIP_PATH}`);

    console.log(`→ Extracting`);
    mkdirSync(CSV_DIR, { recursive: true });
    // tar viene con Windows 10+ y todos los runners de GitHub Actions
    execSync(`tar -xf "${ZIP_PATH}" -C "${CSV_DIR}"`, { stdio: "inherit" });
    console.log(`  ✓ extracted to ${CSV_DIR}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});