import { sqlEscape, normalizeId } from "../util.js";

export function circuitsToSQL(items: any[]): string {
    const lines: string[] = [];
    for (const c of items) {
        const loc = c.Location ?? {};
        lines.push(
            `INSERT INTO circuits (id, name, short_name, country, city, latitude, longitude, wikipedia_url) VALUES (` +
            [
                sqlEscape(normalizeId(c.circuitId)),
                sqlEscape(c.circuitName),
                sqlEscape(c.circuitName),
                sqlEscape(loc.country ?? "Unknown"),
                sqlEscape(loc.locality ?? null),
                sqlEscape(loc.lat ? parseFloat(loc.lat) : null),
                sqlEscape(loc.long ? parseFloat(loc.long) : null),
                sqlEscape(c.url ?? null),
            ].join(", ") +
            `) ON CONFLICT(id) DO UPDATE SET name=excluded.name, country=excluded.country, city=excluded.city;`
        );
    }
    return lines.join("\n");
}