import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { slug } from "./util.js";

const content = readFileSync(join("dump", "csv", "formula_one_team.csv"), "utf-8");
const rows = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true }) as any[];

const ferraris = rows.filter((r) => {
    const s = slug(r.reference || r.name) || `team-${r.id}`;
    return s === "ferrari";
});

console.log(`Found ${ferraris.length} rows with slug 'ferrari':`);
for (const f of ferraris) {
    console.log({
        id: f.id,
        name: f.name,
        reference: f.reference,
        wikipedia: f.wikipedia,
    });
}