import { sqlEscape } from "../util.js";
import { RIVALRIES } from "../data/rivalries.js";

export function rivalriesToSQL(): string {
    const lines: string[] = [];

    lines.push("DELETE FROM rivalry_key_races;");
    lines.push("DELETE FROM rivalries;");
    lines.push(`DELETE FROM translations WHERE entity_type IN ('rivalry', 'rivalry_key_race');`);

    for (const r of RIVALRIES) {
        lines.push(
            `INSERT INTO rivalries (id, driver_a_id, driver_b_id, start_year, end_year, era, intensity) VALUES (` +
            [
                sqlEscape(r.id),
                sqlEscape(r.driverA),
                sqlEscape(r.driverB),
                r.startYear,
                sqlEscape(r.endYear),
                sqlEscape(r.era),
                sqlEscape(r.intensity),
            ].join(", ") + `);`
        );

        for (const lang of ["en", "es"] as const) {
            lines.push(
                `INSERT INTO translations (entity_type, entity_id, field, lang, value) VALUES (` +
                [
                    sqlEscape("rivalry"),
                    sqlEscape(r.id),
                    sqlEscape("description"),
                    sqlEscape(lang),
                    sqlEscape(r.description[lang]),
                ].join(", ") + `);`
            );
        }

        for (const kr of r.keyRaces) {
            lines.push(
                `INSERT INTO rivalry_key_races (rivalry_id, race_id) VALUES (${sqlEscape(r.id)}, ${sqlEscape(kr.raceId)});`
            );
            for (const lang of ["en", "es"] as const) {
                lines.push(
                    `INSERT INTO translations (entity_type, entity_id, field, lang, value) VALUES (` +
                    [
                        sqlEscape("rivalry_key_race"),
                        sqlEscape(`${r.id}:${kr.raceId}`),
                        sqlEscape("significance"),
                        sqlEscape(lang),
                        sqlEscape(kr.significance[lang]),
                    ].join(", ") + `);`
                );
            }
        }
    }

    return lines.join("\n");
}