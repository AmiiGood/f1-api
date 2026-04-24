import { sqlEscape, timeToMs, normalizeId } from "../util.js";
import { raceIdFor } from "./races.js";

export function resultsToSQL(year: number, races: any[]): string {
    const lines: string[] = [];
    lines.push(`DELETE FROM results WHERE race_id IN (SELECT id FROM races WHERE season = ${year});`);

    for (const race of races) {
        const raceId = raceIdFor(year, race.raceName);
        for (const r of race.Results ?? []) {
            const position = r.position ? parseInt(r.position) : null;
            const positionText = r.positionText;
            const numericPosition = !isNaN(Number(positionText)) ? position : null;
            const fastestLap = r.FastestLap ? 1 : 0;

            lines.push(
                `INSERT INTO results (race_id, driver_id, constructor_id, position, position_text, grid, laps, time_ms, status, points, fastest_lap, fastest_lap_time) VALUES (` +
                [
                    sqlEscape(raceId),
                    sqlEscape(normalizeId(r.Driver.driverId)),
                    sqlEscape(normalizeId(r.Constructor.constructorId)),
                    sqlEscape(numericPosition),
                    sqlEscape(positionText),
                    sqlEscape(r.grid ? parseInt(r.grid) : null),
                    sqlEscape(r.laps ? parseInt(r.laps) : null),
                    sqlEscape(timeToMs(r.Time?.time ?? null)),
                    sqlEscape(r.status),
                    sqlEscape(parseFloat(r.points ?? "0")),
                    fastestLap,
                    sqlEscape(r.FastestLap?.Time?.time ?? null),
                ].join(", ") + `);`
            );
        }
    }
    return lines.join("\n");
}