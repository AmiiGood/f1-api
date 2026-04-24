import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DUMP_DIR = join("dump", "csv");

const files = readdirSync(DUMP_DIR).filter((f) => f.endsWith(".csv"));

for (const file of files) {
    const content = readFileSync(join(DUMP_DIR, file), "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());
    const headers = lines[0];
    const firstRow = lines[1] ?? "(empty)";
    const totalRows = lines.length - 1;

    console.log(`\n═══ ${file} (${totalRows} rows) ═══`);
    console.log(`Headers: ${headers}`);
    console.log(`Row 1:   ${firstRow}`);
}