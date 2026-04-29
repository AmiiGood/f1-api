import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { sqlEscape, slug, timeToMs } from "./util.js";
import { writeSQL } from "./writers/sql.js";

const DUMP_DIR = join("dump", "csv");

function readCsv<T = Record<string, string>>(filename: string): T[] {
    const content = readFileSync(join(DUMP_DIR, filename), "utf-8");
    return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true }) as T[];
}

type Driver = { id: string; abbreviation: string; country_code: string; date_of_birth: string; forename: string; nationality: string; permanent_car_number: string; reference: string; surname: string; wikipedia: string };
type Circuit = { id: string; country: string; country_code: string; latitude: string; locality: string; longitude: string; name: string; reference: string; wikipedia: string };
type Team = { id: string; country_code: string; name: string; nationality: string; primary_color: string; reference: string; wikipedia: string };
type Season = { id: string; year: string; wikipedia: string };
type Round = { id: string; circuit_id: string; date: string; is_cancelled: string; name: string; number: string; race_number: string; season_id: string; wikipedia: string };
type Session = { id: string; is_cancelled: string; round_id: string; type: string };
type SessionEntry = { id: string; detail: string; fastest_lap_rank: string; grid: string; laps_completed: string; points: string; position: string; round_entry_id: string; session_id: string; status: string; time: string };
type RoundEntry = { id: string; car_number: string; round_id: string; team_driver_id: string };
type TeamDriver = { id: string; driver_id: string; role: string; season_id: string; team_id: string };

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

export async function etlFromDump() {
    console.log("→ Loading CSVs...");
    const drivers = readCsv<Driver>("formula_one_driver.csv");
    const circuits = readCsv<Circuit>("formula_one_circuit.csv");
    const teams = readCsv<Team>("formula_one_team.csv");
    const seasons = readCsv<Season>("formula_one_season.csv");
    const rounds = readCsv<Round>("formula_one_round.csv");
    const sessions = readCsv<Session>("formula_one_session.csv");
    const sessionEntries = readCsv<SessionEntry>("formula_one_sessionentry.csv");
    const roundEntries = readCsv<RoundEntry>("formula_one_roundentry.csv");
    const teamDrivers = readCsv<TeamDriver>("formula_one_teamdriver.csv");

    console.log(`  drivers=${drivers.length} teams=${teams.length} circuits=${circuits.length} seasons=${seasons.length}`);
    console.log(`  rounds=${rounds.length} sessions=${sessions.length} entries=${sessionEntries.length}`);

    // ── Maps internos ──
    const driverSlug = new Map<string, string>();
    const usedSlugs = new Set<string>();
    for (const d of drivers) {
        let s = slug(`${d.forename} ${d.surname}`) || `driver-${d.id}`;
        if (usedSlugs.has(s)) s = `${s}-${d.id}`;
        usedSlugs.add(s);
        driverSlug.set(d.id, s);
    }

    const teamSlug = new Map<string, string>();
    const uniqueTeams = new Map<string, Team>();
    for (const t of teams) {
        const s = slug(t.reference || t.name) || `team-${t.id}`;
        teamSlug.set(t.id, s);
        if (!uniqueTeams.has(s)) uniqueTeams.set(s, t);
    }

    const circuitSlug = new Map<string, string>();
    for (const c of circuits) {
        circuitSlug.set(c.id, slug(c.reference || c.name) || `circuit-${c.id}`);
    }

    const seasonYear = new Map<string, number>();
    for (const s of seasons) seasonYear.set(s.id, parseInt(s.year));

    const roundInfo = new Map<string, { raceId: string; year: number; round: Round }>();
    for (const r of rounds) {
        const year = seasonYear.get(r.season_id) ?? 0;
        if (!year) continue;
        const raceId = `${year}-${slug(r.name).replace(/-grand-prix$/, "-gp")}`;
        roundInfo.set(r.id, { raceId, year, round: r });
    }

    const teamDriverInfo = new Map<string, { driverId: string; teamId: string }>();
    for (const td of teamDrivers) teamDriverInfo.set(td.id, { driverId: td.driver_id, teamId: td.team_id });

    const roundEntryInfo = new Map<string, { driverSlug: string; teamSlug: string; roundId: string }>();
    for (const re of roundEntries) {
        const td = teamDriverInfo.get(re.team_driver_id);
        if (!td) continue;
        const dS = driverSlug.get(td.driverId);
        const tS = teamSlug.get(td.teamId);
        if (!dS || !tS) continue;
        roundEntryInfo.set(re.id, { driverSlug: dS, teamSlug: tS, roundId: re.round_id });
    }

    // ── 01 drivers ──
    const driverLines = drivers.map((d) =>
        `INSERT INTO drivers (id, first_name, last_name, full_name, code, permanent_number, nationality, date_of_birth, status, wikipedia_url) VALUES (` +
        [
            sqlEscape(driverSlug.get(d.id)!),
            sqlEscape(d.forename || "Unknown"),
            sqlEscape(d.surname || "Unknown"),
            sqlEscape(`${d.forename} ${d.surname}`.trim() || "Unknown"),
            sqlEscape(d.abbreviation || null),
            sqlEscape(d.permanent_car_number ? parseInt(d.permanent_car_number) : null),
            sqlEscape(d.nationality || "Unknown"),
            sqlEscape(d.date_of_birth || null),
            sqlEscape("retired"),
            sqlEscape(d.wikipedia || null),
        ].join(", ") + `);`
    );
    await writeSQL("01_drivers.sql", driverLines.join("\n"));
    console.log(`✓ 01_drivers.sql (${drivers.length})`);

    // ── 02 constructors ──
    const constructorLines: string[] = [];
    for (const [s, t] of uniqueTeams) {
        constructorLines.push(
            `INSERT INTO constructors (id, name, short_name, nationality, primary_color, wikipedia_url) VALUES (` +
            [
                sqlEscape(s),
                sqlEscape(t.name || "Unknown"),
                sqlEscape(t.name || "Unknown"),
                sqlEscape(t.nationality || "Unknown"),
                sqlEscape(t.primary_color || null),
                sqlEscape(t.wikipedia || null),
            ].join(", ") + `);`
        );
    }
    await writeSQL("02_constructors.sql", constructorLines.join("\n"));
    console.log(`✓ 02_constructors.sql (${uniqueTeams.size})`);

    // ── 03 circuits ──
    const circuitLines = circuits.map((c) =>
        `INSERT INTO circuits (id, name, short_name, country, city, latitude, longitude, wikipedia_url) VALUES (` +
        [
            sqlEscape(circuitSlug.get(c.id)!),
            sqlEscape(c.name),
            sqlEscape(c.name),
            sqlEscape(c.country_code || c.country || "UNK"),
            sqlEscape(c.locality || null),
            sqlEscape(c.latitude ? parseFloat(c.latitude) : null),
            sqlEscape(c.longitude ? parseFloat(c.longitude) : null),
            sqlEscape(c.wikipedia || null),
        ].join(", ") + `);`
    );
    await writeSQL("03_circuits.sql", circuitLines.join("\n"));
    console.log(`✓ 03_circuits.sql (${circuits.length})`);

    // ── 04 seasons ──
    const seasonLines = seasons.map((s) => {
        const y = parseInt(s.year);
        return `INSERT INTO seasons (year, total_races, regulation_era) VALUES (${y}, 0, ${sqlEscape(eraFor(y))});`;
    });
    await writeSQL("04_seasons.sql", seasonLines.join("\n"));
    console.log(`✓ 04_seasons.sql (${seasons.length})`);

    // ── 05 races ──
    const raceLines: string[] = [];
    const racesPerYear = new Map<number, number>();
    for (const r of rounds) {
        const info = roundInfo.get(r.id)!;
        const circ = circuitSlug.get(r.circuit_id);
        if (!circ) continue;
        raceLines.push(
            `INSERT INTO races (id, season, round, name, official_name, circuit_id, date) VALUES (` +
            [
                sqlEscape(info.raceId),
                info.year,
                parseInt(r.number) || parseInt(r.race_number) || 0,
                sqlEscape(r.name),
                sqlEscape(r.name),
                sqlEscape(circ),
                sqlEscape(r.date),
            ].join(", ") + `) ON CONFLICT(id) DO NOTHING;`
        );
        racesPerYear.set(info.year, (racesPerYear.get(info.year) ?? 0) + 1);
    }
    for (const [y, c] of racesPerYear) {
        raceLines.push(`UPDATE seasons SET total_races = ${c} WHERE year = ${y};`);
    }
    await writeSQL("05_races.sql", raceLines.join("\n"));
    console.log(`✓ 05_races.sql (${rounds.length})`);

    // ── Clasificar sessions ──
    const entriesBySession = new Map<string, SessionEntry[]>();
    for (const e of sessionEntries) {
        const arr = entriesBySession.get(e.session_id) ?? [];
        arr.push(e);
        entriesBySession.set(e.session_id, arr);
    }

    const raceSessionByRound = new Map<string, string>();
    const sprintSessionByRound = new Map<string, string>();
    const qualiByRound = new Map<string, { q?: string; q1?: string; q2?: string; q3?: string }>();
    const sprintQualiByRound = new Map<string, { sq1?: string; sq2?: string; sq3?: string }>();
    const sprintShootoutByRound = new Map<string, { sq1?: string; sq2?: string; sq3?: string }>();

    for (const s of sessions) {
        if (s.is_cancelled === "t") continue;
        if (s.type === "R") {
            raceSessionByRound.set(s.round_id, s.id);
        } else if (s.type === "S" || s.type === "SR") {
            // Sprint race: "S" (2021-2022) o "SR" (2023+)
            sprintSessionByRound.set(s.round_id, s.id);
        } else if (["Q", "Q1", "Q2", "Q3"].includes(s.type)) {
            const cur = qualiByRound.get(s.round_id) ?? {};
            const key = s.type.toLowerCase() as "q" | "q1" | "q2" | "q3";
            cur[key] = s.id;
            qualiByRound.set(s.round_id, cur);
        } else if (["SS", "SS1", "SS2", "SS3", "SQ", "SQ1", "SQ2", "SQ3"].includes(s.type)) {
            // Sprint Shootout (2023) o Sprint Qualifying (2024+)
            const cur = sprintQualiByRound.get(s.round_id) ?? {};
            const normalized = s.type.replace(/^S[SQ]/, "sq").toLowerCase();
            const key = (normalized === "sq" ? "sq1" : normalized) as "sq1" | "sq2" | "sq3";
            cur[key] = s.id;
            sprintQualiByRound.set(s.round_id, cur);
        }
    }

    // ── 06 results ──
    const resultLines: string[] = ["DELETE FROM results;"];
    for (const [roundId, sessionId] of raceSessionByRound) {
        const info = roundInfo.get(roundId);
        if (!info) continue;
        const entries = entriesBySession.get(sessionId) ?? [];
        for (const e of entries) {
            const re = roundEntryInfo.get(e.round_entry_id);
            if (!re) continue;
            const numPos = e.position && /^\d+$/.test(e.position) ? parseInt(e.position) : null;
            resultLines.push(
                `INSERT INTO results (race_id, driver_id, constructor_id, position, position_text, grid, laps, time_ms, status, points, fastest_lap) VALUES (` +
                [
                    sqlEscape(info.raceId),
                    sqlEscape(re.driverSlug),
                    sqlEscape(re.teamSlug),
                    sqlEscape(numPos),
                    sqlEscape(numPos ? String(numPos) : (e.detail || "R")),
                    sqlEscape(e.grid ? parseInt(e.grid) : null),
                    sqlEscape(e.laps_completed ? parseInt(e.laps_completed) : null),
                    sqlEscape(timeToMs(e.time || null)),
                    sqlEscape(e.detail || "Finished"),
                    sqlEscape(e.points ? parseFloat(e.points) : 0),
                    e.fastest_lap_rank === "1" ? 1 : 0,
                ].join(", ") + `);`
            );
        }
    }
    await writeSQL("06_results.sql", resultLines.join("\n"));
    console.log(`✓ 06_results.sql`);

    // ── 07 qualifying (pivot) ──
    const qLines: string[] = ["DELETE FROM qualifying;"];
    for (const [roundId, q] of qualiByRound) {
        const info = roundInfo.get(roundId);
        if (!info) continue;
        type QR = { re: string; pos: number | null; q1?: string; q2?: string; q3?: string };
        const byEntry = new Map<string, QR>();
        const addSess = (sId: string | undefined, field: "q1" | "q2" | "q3" | "q") => {
            if (!sId) return;
            for (const e of entriesBySession.get(sId) ?? []) {
                const row = byEntry.get(e.round_entry_id) ?? { re: e.round_entry_id, pos: null };
                if (e.time) {
                    if (field === "q" || field === "q1") row.q1 = e.time;
                    else if (field === "q2") row.q2 = e.time;
                    else if (field === "q3") row.q3 = e.time;
                }
                if (e.position && /^\d+$/.test(e.position)) {
                    const p = parseInt(e.position);
                    if (field === "q3") row.pos = p;
                    else if (field === "q2" && row.pos == null) row.pos = p;
                    else if ((field === "q1" || field === "q") && row.pos == null) row.pos = p;
                }
                byEntry.set(e.round_entry_id, row);
            }
        };
        addSess(q.q, "q");
        addSess(q.q1, "q1");
        addSess(q.q2, "q2");
        addSess(q.q3, "q3");

        for (const row of byEntry.values()) {
            const re = roundEntryInfo.get(row.re);
            if (!re || row.pos == null) continue;
            qLines.push(
                `INSERT INTO qualifying (race_id, driver_id, constructor_id, position, q1_time, q2_time, q3_time) VALUES (` +
                [
                    sqlEscape(info.raceId),
                    sqlEscape(re.driverSlug),
                    sqlEscape(re.teamSlug),
                    row.pos,
                    sqlEscape(row.q1 ?? null),
                    sqlEscape(row.q2 ?? null),
                    sqlEscape(row.q3 ?? null),
                ].join(", ") + `);`
            );
        }
    }
    await writeSQL("07_qualifying.sql", qLines.join("\n"));
    console.log(`✓ 07_qualifying.sql`);

    // ── 07b sprint_results ──
    const sprintResultLines: string[] = ["DELETE FROM sprint_results;"];
    for (const [roundId, sessionId] of sprintSessionByRound) {
        const info = roundInfo.get(roundId);
        if (!info) continue;
        const entries = entriesBySession.get(sessionId) ?? [];
        for (const e of entries) {
            const re = roundEntryInfo.get(e.round_entry_id);
            if (!re) continue;
            const numPos = e.position && /^\d+$/.test(e.position) ? parseInt(e.position) : null;
            sprintResultLines.push(
                `INSERT INTO sprint_results (race_id, driver_id, constructor_id, position, position_text, grid, laps, time_ms, status, points, fastest_lap, fastest_lap_time) VALUES (` +
                [
                    sqlEscape(info.raceId),
                    sqlEscape(re.driverSlug),
                    sqlEscape(re.teamSlug),
                    sqlEscape(numPos),
                    sqlEscape(numPos ? String(numPos) : (e.detail || "R")),
                    sqlEscape(e.grid ? parseInt(e.grid) : null),
                    sqlEscape(e.laps_completed ? parseInt(e.laps_completed) : null),
                    sqlEscape(timeToMs(e.time || null)),
                    sqlEscape(e.detail || "Finished"),
                    sqlEscape(e.points ? parseFloat(e.points) : 0),
                    e.fastest_lap_rank === "1" ? 1 : 0,
                    sqlEscape(null),
                ].join(", ") + `);`
            );
        }
    }
    // Marca has_sprint en races
    sprintResultLines.push(
        `UPDATE races SET has_sprint = 1 WHERE id IN (SELECT DISTINCT race_id FROM sprint_results);`
    );
    await writeSQL("07b_sprint_results.sql", sprintResultLines.join("\n"));
    console.log(`✓ 07b_sprint_results.sql (${sprintSessionByRound.size} sprint races)`);

    // ── 07c sprint_qualifying ──
    const sqLines: string[] = ["DELETE FROM sprint_qualifying;"];
    for (const [roundId, sq] of sprintQualiByRound) {
        const info = roundInfo.get(roundId);
        if (!info) continue;
        type SQR = { re: string; pos: number | null; sq1?: string; sq2?: string; sq3?: string };
        const byEntry = new Map<string, SQR>();
        const addSess = (sId: string | undefined, field: "sq1" | "sq2" | "sq3") => {
            if (!sId) return;
            for (const e of entriesBySession.get(sId) ?? []) {
                const row = byEntry.get(e.round_entry_id) ?? { re: e.round_entry_id, pos: null };
                if (e.time) row[field] = e.time;
                if (e.position && /^\d+$/.test(e.position)) {
                    const p = parseInt(e.position);
                    if (field === "sq3") row.pos = p;
                    else if (field === "sq2" && row.pos == null) row.pos = p;
                    else if (field === "sq1" && row.pos == null) row.pos = p;
                }
                byEntry.set(e.round_entry_id, row);
            }
        };
        addSess(sq.sq1, "sq1");
        addSess(sq.sq2, "sq2");
        addSess(sq.sq3, "sq3");

        for (const row of byEntry.values()) {
            const re = roundEntryInfo.get(row.re);
            if (!re || row.pos == null) continue;
            sqLines.push(
                `INSERT INTO sprint_qualifying (race_id, driver_id, constructor_id, position, sq1_time, sq2_time, sq3_time) VALUES (` +
                [
                    sqlEscape(info.raceId),
                    sqlEscape(re.driverSlug),
                    sqlEscape(re.teamSlug),
                    row.pos,
                    sqlEscape(row.sq1 ?? null),
                    sqlEscape(row.sq2 ?? null),
                    sqlEscape(row.sq3 ?? null),
                ].join(", ") + `);`
            );
        }
    }
    await writeSQL("07c_sprint_qualifying.sql", sqLines.join("\n"));
    console.log(`✓ 07c_sprint_qualifying.sql`);

    // ── 08 standings (calculados desde results) ──
    const stand = [
        "DELETE FROM driver_standings;",
        "DELETE FROM constructor_standings;",
        `INSERT INTO driver_standings (season, round, driver_id, constructor_id, position, points, wins)
 SELECT rc.season, MAX(rc.round), r.driver_id,
   (SELECT r2.constructor_id FROM results r2 JOIN races rc2 ON r2.race_id = rc2.id
     WHERE r2.driver_id = r.driver_id AND rc2.season = rc.season
     ORDER BY rc2.round DESC LIMIT 1),
   ROW_NUMBER() OVER (PARTITION BY rc.season ORDER BY (SUM(r.points) + COALESCE((SELECT SUM(sr.points) FROM sprint_results sr JOIN races rc3 ON sr.race_id = rc3.id WHERE sr.driver_id = r.driver_id AND rc3.season = rc.season), 0)) DESC, SUM(CASE WHEN r.position=1 THEN 1 ELSE 0 END) DESC),
   SUM(r.points) + COALESCE((SELECT SUM(sr.points) FROM sprint_results sr JOIN races rc3 ON sr.race_id = rc3.id WHERE sr.driver_id = r.driver_id AND rc3.season = rc.season), 0),
   SUM(CASE WHEN r.position=1 THEN 1 ELSE 0 END)
 FROM results r JOIN races rc ON r.race_id = rc.id
 GROUP BY rc.season, r.driver_id;`,
        `INSERT INTO constructor_standings (season, round, constructor_id, position, points, wins)
 SELECT rc.season, MAX(rc.round), r.constructor_id,
   ROW_NUMBER() OVER (PARTITION BY rc.season ORDER BY (SUM(r.points) + COALESCE((SELECT SUM(sr.points) FROM sprint_results sr JOIN races rc3 ON sr.race_id = rc3.id WHERE sr.constructor_id = r.constructor_id AND rc3.season = rc.season), 0)) DESC, SUM(CASE WHEN r.position=1 THEN 1 ELSE 0 END) DESC),
   SUM(r.points) + COALESCE((SELECT SUM(sr.points) FROM sprint_results sr JOIN races rc3 ON sr.race_id = rc3.id WHERE sr.constructor_id = r.constructor_id AND rc3.season = rc.season), 0),
   SUM(CASE WHEN r.position=1 THEN 1 ELSE 0 END)
 FROM results r JOIN races rc ON r.race_id = rc.id
 WHERE rc.season >= 1958
 GROUP BY rc.season, r.constructor_id;`,
        `UPDATE seasons SET champion_driver_id = (SELECT driver_id FROM driver_standings ds WHERE ds.season = seasons.year AND ds.position = 1);`,
        `UPDATE seasons SET champion_constructor_id = (SELECT constructor_id FROM constructor_standings cs WHERE cs.season = seasons.year AND cs.position = 1);`,
        `UPDATE drivers SET status = 'active' WHERE id IN (
   SELECT DISTINCT r.driver_id FROM results r
   JOIN races rc ON r.race_id = rc.id
   WHERE rc.season >= (SELECT MAX(season) FROM races) - 1
 );`,
        `UPDATE seasons SET champion_driver_id = NULL, champion_constructor_id = NULL
WHERE year IN (
  SELECT DISTINCT season FROM races WHERE date > date('now')
);`,
    ];
    await writeSQL("08_standings.sql", stand.join("\n"));
    console.log(`✓ 08_standings.sql`);
}