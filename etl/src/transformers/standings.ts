import { sqlEscape, normalizeId } from "../util.js";

export function driverStandingsToSQL(year: number, standingsLists: any[]): string {
    const lines: string[] = [];
    lines.push(`DELETE FROM driver_standings WHERE season = ${year};`);

    for (const list of standingsLists) {
        const round = parseInt(list.round);
        for (const s of list.DriverStandings) {
            const constructorId = s.Constructors?.[0]?.constructorId ?? null;
            lines.push(
                `INSERT INTO driver_standings (season, round, driver_id, constructor_id, position, points, wins) VALUES (` +
                [
                    year,
                    round,
                    sqlEscape(normalizeId(s.Driver.driverId)),
                    sqlEscape(constructorId ? normalizeId(constructorId) : null),
                    parseInt(s.position),
                    parseFloat(s.points),
                    parseInt(s.wins),
                ].join(", ") + `);`
            );
        }
    }

    lines.push(`
    UPDATE seasons SET champion_driver_id = (
      SELECT driver_id FROM driver_standings
      WHERE season = ${year} AND round = (SELECT MAX(round) FROM driver_standings WHERE season = ${year})
      ORDER BY position ASC LIMIT 1
    ) WHERE year = ${year};
  `.trim());

    return lines.join("\n");
}

export function constructorStandingsToSQL(year: number, standingsLists: any[]): string {
    const lines: string[] = [];
    lines.push(`DELETE FROM constructor_standings WHERE season = ${year};`);

    for (const list of standingsLists) {
        const round = parseInt(list.round);
        for (const s of list.ConstructorStandings) {
            lines.push(
                `INSERT INTO constructor_standings (season, round, constructor_id, position, points, wins) VALUES (` +
                [
                    year,
                    round,
                    sqlEscape(normalizeId(s.Constructor.constructorId)),
                    parseInt(s.position),
                    parseFloat(s.points),
                    parseInt(s.wins),
                ].join(", ") + `);`
            );
        }
    }

    lines.push(`
    UPDATE seasons SET champion_constructor_id = (
      SELECT constructor_id FROM constructor_standings
      WHERE season = ${year} AND round = (SELECT MAX(round) FROM constructor_standings WHERE season = ${year})
      ORDER BY position ASC LIMIT 1
    ) WHERE year = ${year};
  `.trim());

    return lines.join("\n");
}