import { jolpica } from "./jolpica.js";
import { driversToSQL } from "./transformers/drivers.js";
import { constructorsToSQL } from "./transformers/constructors.js";
import { circuitsToSQL } from "./transformers/circuits.js";
import { seasonsToSQL } from "./transformers/seasons.js";
import { racesToSQL } from "./transformers/races.js";
import { resultsToSQL } from "./transformers/results.js";
import { qualifyingToSQL } from "./transformers/qualifying.js";
import { driverStandingsToSQL, constructorStandingsToSQL } from "./transformers/standings.js";
import { writeSQL } from "./writers/sql.js";
import { rivalriesToSQL } from "./transformers/rivalries.js";
import { recordsSQL } from "./transformers/records.js";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { etlFromDump } from "./dump.js";


const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

async function etlCore() {
    console.log("→ Fetching drivers...");
    const drivers = await jolpica.driversAll();
    await writeSQL("01_drivers.sql", driversToSQL(drivers));
    console.log(`  ✓ ${drivers.length} drivers`);

    console.log("→ Fetching constructors...");
    const constructors = await jolpica.constructorsAll();
    await writeSQL("02_constructors.sql", constructorsToSQL(constructors));
    console.log(`  ✓ ${constructors.length} constructors`);

    console.log("→ Fetching circuits...");
    const circuits = await jolpica.circuitsAll();
    await writeSQL("03_circuits.sql", circuitsToSQL(circuits));
    console.log(`  ✓ ${circuits.length} circuits`);

    console.log("→ Generating seasons...");
    const years = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
    await writeSQL("04_seasons.sql", seasonsToSQL(years));
    console.log(`  ✓ ${years.length} seasons`);
}

async function etlYear(year: number) {
    console.log(`\n═══ Year ${year} ═══`);

    console.log("→ races");
    const races = await jolpica.racesBySeason(year);
    let sql = racesToSQL(year, races) + "\n";

    console.log("→ results");
    const resultsData = await jolpica.resultsBySeason(year);
    sql += resultsToSQL(year, resultsData) + "\n";

    console.log("→ qualifying");
    // qualifying solo existe desde 1994 aprox
    if (year >= 1994) {
        const qData = await jolpica.qualifyingBySeason(year);
        sql += qualifyingToSQL(year, qData) + "\n";
    }

    console.log("→ driver standings");
    const ds = await jolpica.driverStandingsBySeason(year);
    sql += driverStandingsToSQL(year, ds) + "\n";

    console.log("→ constructor standings");
    // pre-1958 no había campeonato de constructores
    if (year >= 1958) {
        const cs = await jolpica.constructorStandingsBySeason(year);
        sql += constructorStandingsToSQL(year, cs) + "\n";
    }

    await writeSQL(`year_${year}.sql`, sql);
    console.log(`  ✓ saved year_${year}.sql`);
}

async function etlEnrich() {
    console.log("→ Writing rivalries");
    await writeSQL("90_rivalries.sql", rivalriesToSQL());
    console.log("→ Writing records");
    await writeSQL("91_records.sql", recordsSQL());
    console.log("  ✓ done");
}

function yearAlreadyDone(year: number): boolean {
    return existsSync(join("output", `year_${year}.sql`));
}

async function main() {
    const cmd = process.argv[2];
    const arg = process.argv[3];

    if (cmd === "dump") {
        await etlFromDump();
    } else if (cmd === "enrich") {
        await etlEnrich();
    } else if (cmd === "core") {
        await etlCore();
    } else if (cmd === "year") {
        if (!arg) throw new Error("Usage: etl year <YYYY>");
        await etlYear(parseInt(arg));
    } else {
        console.log("Usage: tsx src/index.ts [dump|enrich|core|year <YYYY>]");
        process.exit(1);
    }
    console.log("\n✓ Done");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});