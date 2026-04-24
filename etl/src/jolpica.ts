import { sleep } from "./util.js";

const BASE = "https://api.jolpi.ca/ergast/f1";
const DELAY_MS = 500; // 2 req/s (antes era 4)
const MAX_ATTEMPTS = 10;

let lastRequest = 0;

async function rateLimitedFetch(url: string): Promise<any> {
    const elapsed = Date.now() - lastRequest;
    if (elapsed < DELAY_MS) await sleep(DELAY_MS - elapsed);
    lastRequest = Date.now();

    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
        const res = await fetch(url);
        if (res.status === 429) {
            // exponential backoff: 5s, 10s, 20s, 40s, 60s, 60s...
            const wait = Math.min(5000 * Math.pow(2, attempts), 60000);
            console.warn(`  429 rate limited, waiting ${wait / 1000}s (attempt ${attempts + 1}/${MAX_ATTEMPTS})`);
            await sleep(wait);
            attempts++;
            lastRequest = Date.now();
            continue;
        }
        if (res.status >= 500) {
            const wait = 3000;
            console.warn(`  ${res.status} server error, waiting ${wait}ms`);
            await sleep(wait);
            attempts++;
            continue;
        }
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
        return res.json();
    }
    throw new Error(`Failed after ${MAX_ATTEMPTS} retries: ${url}`);
}

async function fetchPaginated(path: string, resultKey: string, subKey: string): Promise<any[]> {
    const results: any[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        const url = `${BASE}${path}.json?limit=${limit}&offset=${offset}`;
        const data = await rateLimitedFetch(url);
        const items = data.MRData[resultKey]?.[subKey] ?? [];
        results.push(...items);

        const total = parseInt(data.MRData.total);
        offset += limit;
        if (offset >= total) break;
    }

    return results;
}

export const jolpica = {
    seasons: () => fetchPaginated("/seasons", "SeasonTable", "Seasons"),
    driversAll: () => fetchPaginated("/drivers", "DriverTable", "Drivers"),
    constructorsAll: () => fetchPaginated("/constructors", "ConstructorTable", "Constructors"),
    circuitsAll: () => fetchPaginated("/circuits", "CircuitTable", "Circuits"),

    racesBySeason: (year: number) =>
        fetchPaginated(`/${year}/races`, "RaceTable", "Races"),

    resultsBySeason: (year: number) =>
        fetchPaginated(`/${year}/results`, "RaceTable", "Races"),

    qualifyingBySeason: (year: number) =>
        fetchPaginated(`/${year}/qualifying`, "RaceTable", "Races"),

    driverStandingsBySeason: async (year: number) => {
        const data = await rateLimitedFetch(`${BASE}/${year}/driverstandings.json?limit=100`);
        return data.MRData.StandingsTable.StandingsLists;
    },

    constructorStandingsBySeason: async (year: number) => {
        const data = await rateLimitedFetch(`${BASE}/${year}/constructorstandings.json?limit=100`);
        return data.MRData.StandingsTable.StandingsLists;
    },
};