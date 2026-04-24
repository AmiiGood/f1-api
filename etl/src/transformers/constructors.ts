import { sqlEscape, normalizeId } from "../util.js";

export function constructorsToSQL(items: any[]): string {
    const lines: string[] = [];
    for (const c of items) {
        lines.push(
            `INSERT INTO constructors (id, name, short_name, nationality, wikipedia_url) VALUES (` +
            [
                sqlEscape(normalizeId(c.constructorId)),
                sqlEscape(c.name ?? "Unknown"),
                sqlEscape(c.name ?? "Unknown"),
                sqlEscape(c.nationality ?? "Unknown"),
                sqlEscape(c.url ?? null),
            ].join(", ") +
            `) ON CONFLICT(id) DO UPDATE SET name=excluded.name, nationality=excluded.nationality, wikipedia_url=excluded.wikipedia_url;`
        );
    }
    return lines.join("\n");
}