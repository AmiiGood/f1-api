import { sqlEscape, slug, normalizeId } from "../util.js";

export function racesToSQL(year: number, races: any[]): string {
    const lines: string[] = [];
    for (const r of races) {
        const id = `${year}-${slug(r.raceName).replace(/-grand-prix$/, "-gp")}`;
        lines.push(
            `INSERT INTO races (id, season, round, name, official_name, circuit_id, date, time_utc) VALUES (` +
            [
                sqlEscape(id),
                year,
                parseInt(r.round),
                sqlEscape(r.raceName),
                sqlEscape(r.raceName),
                sqlEscape(normalizeId(r.Circuit.circuitId)),
                sqlEscape(r.date),
                sqlEscape(r.time?.replace("Z", "") ?? null),
            ].join(", ") +
            `) ON CONFLICT(id) DO UPDATE SET name=excluded.name, date=excluded.date, time_utc=excluded.time_utc;`
        );
    }
    lines.push(`UPDATE seasons SET total_races = ${races.length} WHERE year = ${year};`);
    return lines.join("\n");
}

export function raceIdFor(year: number, raceName: string): string {
    return `${year}-${slug(raceName).replace(/-grand-prix$/, "-gp")}`;
}