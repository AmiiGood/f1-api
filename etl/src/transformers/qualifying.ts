import { sqlEscape, normalizeId } from "../util.js";
import { raceIdFor } from "./races.js";

export function qualifyingToSQL(year: number, races: any[]): string {
    const lines: string[] = [];
    lines.push(`DELETE FROM qualifying WHERE race_id IN (SELECT id FROM races WHERE season = ${year});`);

    for (const race of races) {
        const raceId = raceIdFor(year, race.raceName);
        for (const q of race.QualifyingResults ?? []) {
            lines.push(
                `INSERT INTO qualifying (race_id, driver_id, constructor_id, position, q1_time, q2_time, q3_time) VALUES (` +
                [
                    sqlEscape(raceId),
                    sqlEscape(normalizeId(q.Driver.driverId)),
                    sqlEscape(normalizeId(q.Constructor.constructorId)),
                    parseInt(q.position),
                    sqlEscape(q.Q1 ?? null),
                    sqlEscape(q.Q2 ?? null),
                    sqlEscape(q.Q3 ?? null),
                ].join(", ") + `);`
            );
        }
    }
    return lines.join("\n");
}