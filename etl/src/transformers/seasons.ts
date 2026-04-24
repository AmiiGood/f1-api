import { sqlEscape } from "../util.js";

export function seasonsToSQL(years: number[]): string {
    const lines: string[] = [];
    for (const year of years) {
        lines.push(
            `INSERT INTO seasons (year, total_races, regulation_era) VALUES (${year}, 0, ${sqlEscape(eraFor(year))}) ON CONFLICT(year) DO NOTHING;`
        );
    }
    return lines.join("\n");
}

function eraFor(year: number): string {
    if (year < 1958) return "pioneer";
    if (year < 1966) return "1.5L";
    if (year < 1977) return "3L";
    if (year < 1989) return "turbo";
    if (year < 1995) return "3.5L";
    if (year < 2006) return "v10";
    if (year < 2014) return "v8";
    if (year < 2022) return "hybrid";
    return "ground-effect";
}