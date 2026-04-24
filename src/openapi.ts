export const openApiSpec = {
    openapi: "3.1.0",
    info: {
        title: "F1 API",
        version: "1.0.0",
        description: `
A free, developer-friendly Formula 1 API with historical data from 1950 to present.

**Built by [Sweet Code](https://sweetcode.dev)** · Data sourced from [Jolpica-F1](https://jolpi.ca).

### Features
- 76+ seasons, 1,173+ races, 879+ drivers, 214+ constructors
- Clean slug IDs (\`max-verstappen\`, \`ferrari\`, \`monza\`)
- Curated rivalries and records
- Bilingual content (EN/ES) via \`?lang=es\`
- Paginated responses with \`limit\` and \`offset\`

### Rate limits
Public endpoints. Please be respectful — cache responses when you can.

### Attribution
Data derived from Jolpica-F1 under non-commercial terms. If you use this API, a link back is appreciated.
    `.trim(),
        contact: { name: "Sweet Code", url: "https://sweetcode.dev" },
        license: { name: "Data: CC BY 4.0 (Jolpica)", url: "https://creativecommons.org/licenses/by/4.0/" },
    },
    servers: [
        { url: "https://f1-api.sweetcode.workers.dev", description: "Production" },
    ],
    tags: [
        { name: "Seasons", description: "F1 seasons from 1950 to present" },
        { name: "Races", description: "Individual races with results and qualifying" },
        { name: "Drivers", description: "Driver profiles, stats, and career data" },
        { name: "Constructors", description: "Teams and their history" },
        { name: "Circuits", description: "Tracks where F1 has raced" },
        { name: "Champions", description: "World champions since 1950" },
        { name: "Rivalries", description: "Curated legendary rivalries" },
        { name: "Records", description: "All-time records and milestones" },
    ],
    components: {
        parameters: {
            lang: {
                name: "lang",
                in: "query",
                description: "Language code for translated fields (bios, descriptions).",
                schema: { type: "string", enum: ["en", "es"], default: "en" },
            },
            limit: {
                name: "limit",
                in: "query",
                description: "Max number of items (1-100).",
                schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            },
            offset: {
                name: "offset",
                in: "query",
                description: "Items to skip for pagination.",
                schema: { type: "integer", minimum: 0, default: 0 },
            },
        },
        schemas: {
            Driver: {
                type: "object",
                properties: {
                    id: { type: "string", example: "max-verstappen" },
                    firstName: { type: "string", example: "Max" },
                    lastName: { type: "string", example: "Verstappen" },
                    fullName: { type: "string", example: "Max Verstappen" },
                    code: { type: "string", nullable: true, example: "VER" },
                    permanentNumber: { type: "integer", nullable: true, example: 33 },
                    nationality: { type: "string", example: "Dutch" },
                    dateOfBirth: { type: "string", format: "date", nullable: true },
                    dateOfDeath: { type: "string", format: "date", nullable: true },
                    status: { type: "string", enum: ["active", "retired", "deceased"] },
                    imageUrl: { type: "string", nullable: true },
                    wikipediaUrl: { type: "string", nullable: true },
                    bio: { type: "string", nullable: true, description: "Biography (only in single-driver endpoint, translated)" },
                },
            },
            Constructor: {
                type: "object",
                properties: {
                    id: { type: "string", example: "ferrari" },
                    name: { type: "string", example: "Scuderia Ferrari" },
                    shortName: { type: "string", example: "Ferrari" },
                    nationality: { type: "string", example: "Italian" },
                    baseLocation: { type: "string", nullable: true },
                    foundedYear: { type: "integer", nullable: true },
                    primaryColor: { type: "string", nullable: true, example: "#DC0000" },
                    logoUrl: { type: "string", nullable: true },
                    wikipediaUrl: { type: "string", nullable: true },
                },
            },
            Circuit: {
                type: "object",
                properties: {
                    id: { type: "string", example: "monza" },
                    name: { type: "string", example: "Autodromo Nazionale Monza" },
                    country: { type: "string", example: "ITA" },
                    city: { type: "string", nullable: true, example: "Monza" },
                    lengthKm: { type: "number", nullable: true },
                    turns: { type: "integer", nullable: true },
                    latitude: { type: "number", nullable: true },
                    longitude: { type: "number", nullable: true },
                    layoutSvgUrl: { type: "string", nullable: true },
                    wikipediaUrl: { type: "string", nullable: true },
                },
            },
            Season: {
                type: "object",
                properties: {
                    year: { type: "integer", example: 2024 },
                    championDriverId: { type: "string", nullable: true, example: "max-verstappen" },
                    championConstructorId: { type: "string", nullable: true, example: "mclaren" },
                    totalRaces: { type: "integer", example: 24 },
                    regulationEra: { type: "string", nullable: true, example: "ground-effect" },
                },
            },
            Race: {
                type: "object",
                properties: {
                    id: { type: "string", example: "2024-italian-gp" },
                    season: { type: "integer", example: 2024 },
                    round: { type: "integer", example: 16 },
                    name: { type: "string", example: "Italian Grand Prix" },
                    circuitId: { type: "string", example: "monza" },
                    date: { type: "string", format: "date" },
                    hasSprint: { type: "boolean" },
                },
            },
            Result: {
                type: "object",
                properties: {
                    raceId: { type: "string" },
                    driverId: { type: "string" },
                    constructorId: { type: "string" },
                    position: { type: "integer", nullable: true },
                    positionText: { type: "string", example: "1" },
                    grid: { type: "integer", nullable: true },
                    laps: { type: "integer", nullable: true },
                    status: { type: "string", example: "Finished" },
                    points: { type: "number" },
                    fastestLap: { type: "boolean" },
                },
            },
            Standing: {
                type: "object",
                properties: {
                    season: { type: "integer" },
                    round: { type: "integer" },
                    position: { type: "integer" },
                    points: { type: "number" },
                    wins: { type: "integer" },
                    driverId: { type: "string" },
                    constructorId: { type: "string" },
                },
            },
            DriverStats: {
                type: "object",
                properties: {
                    races: { type: "integer", example: 383 },
                    wins: { type: "integer", example: 105 },
                    podiums: { type: "integer", example: 203 },
                    points: { type: "number", example: 4990.5 },
                    fastestLaps: { type: "integer", example: 68 },
                },
            },
            Rivalry: {
                type: "object",
                properties: {
                    id: { type: "string", example: "senna-vs-prost" },
                    driverAId: { type: "string" },
                    driverBId: { type: "string" },
                    startYear: { type: "integer" },
                    endYear: { type: "integer", nullable: true },
                    era: { type: "string", nullable: true },
                    intensity: { type: "string", enum: ["legendary", "intense", "notable"] },
                    description: { type: "string", nullable: true },
                    keyRaces: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                raceId: { type: "string" },
                                raceName: { type: "string" },
                                season: { type: "integer" },
                                date: { type: "string", format: "date" },
                                significance: { type: "string", nullable: true },
                            },
                        },
                    },
                },
            },
            Record: {
                type: "object",
                properties: {
                    id: { type: "string", example: "most-wins-driver" },
                    category: { type: "string", enum: ["driver", "constructor", "race"] },
                    metric: { type: "string", example: "wins" },
                    holderType: { type: "string", enum: ["driver", "constructor"] },
                    holderId: { type: "string", example: "lewis-hamilton" },
                    value: { type: "number", example: 105 },
                    dateSet: { type: "string", format: "date", nullable: true },
                    stillActive: { type: "boolean" },
                },
            },
            Champion: {
                type: "object",
                properties: {
                    year: { type: "integer" },
                    driverId: { type: "string", nullable: true },
                    driverName: { type: "string", nullable: true },
                    constructorId: { type: "string", nullable: true },
                    constructorName: { type: "string", nullable: true },
                },
            },
            Pagination: {
                type: "object",
                properties: {
                    limit: { type: "integer" },
                    offset: { type: "integer" },
                    total: { type: "integer" },
                },
            },
            Error: {
                type: "object",
                properties: {
                    error: {
                        type: "object",
                        properties: {
                            code: { type: "integer" },
                            message: { type: "string" },
                        },
                    },
                },
            },
        },
    },
    paths: {
        "/v1/seasons": {
            get: {
                tags: ["Seasons"],
                summary: "List all seasons",
                parameters: [{ $ref: "#/components/parameters/limit" }, { $ref: "#/components/parameters/offset" }],
                responses: {
                    "200": {
                        description: "List of seasons (most recent first)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { type: "array", items: { $ref: "#/components/schemas/Season" } },
                                        pagination: { $ref: "#/components/schemas/Pagination" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/v1/seasons/{year}": {
            get: {
                tags: ["Seasons"],
                summary: "Get a single season",
                parameters: [
                    { name: "year", in: "path", required: true, schema: { type: "integer", example: 2024 } },
                    { $ref: "#/components/parameters/lang" },
                ],
                responses: {
                    "200": { description: "Season details", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Season" } } } } } },
                    "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
                },
            },
        },
        "/v1/seasons/{year}/races": {
            get: {
                tags: ["Seasons"],
                summary: "Get all races in a season",
                parameters: [{ name: "year", in: "path", required: true, schema: { type: "integer", example: 2024 } }],
                responses: { "200": { description: "List of races", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Race" } } } } } } } },
            },
        },
        "/v1/seasons/{year}/standings/drivers": {
            get: {
                tags: ["Seasons"],
                summary: "Driver standings for a season",
                parameters: [
                    { name: "year", in: "path", required: true, schema: { type: "integer", example: 2024 } },
                    { name: "round", in: "query", description: "Standings after a specific round. Defaults to last round.", schema: { type: "integer" } },
                ],
                responses: { "200": { description: "Driver standings", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Standing" } } } } } } } },
            },
        },
        "/v1/seasons/{year}/standings/constructors": {
            get: {
                tags: ["Seasons"],
                summary: "Constructor standings for a season",
                parameters: [
                    { name: "year", in: "path", required: true, schema: { type: "integer", example: 2024 } },
                    { name: "round", in: "query", schema: { type: "integer" } },
                ],
                responses: { "200": { description: "Constructor standings" } },
            },
        },
        "/v1/races": {
            get: {
                tags: ["Races"],
                summary: "List races with optional filters",
                parameters: [
                    { name: "season", in: "query", schema: { type: "integer" } },
                    { name: "circuit", in: "query", schema: { type: "string" } },
                    { $ref: "#/components/parameters/limit" },
                    { $ref: "#/components/parameters/offset" },
                ],
                responses: { "200": { description: "List of races" } },
            },
        },
        "/v1/races/{id}": {
            get: {
                tags: ["Races"],
                summary: "Get a single race",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "2024-italian-gp" } }],
                responses: { "200": { description: "Race details", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Race" } } } } } } },
            },
        },
        "/v1/races/{id}/results": {
            get: {
                tags: ["Races"],
                summary: "Get race results",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "2024-italian-gp" } }],
                responses: { "200": { description: "Results ordered by finishing position" } },
            },
        },
        "/v1/races/{id}/qualifying": {
            get: {
                tags: ["Races"],
                summary: "Get qualifying results",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "2024-italian-gp" } }],
                responses: { "200": { description: "Qualifying results with Q1/Q2/Q3 times" } },
            },
        },
        "/v1/drivers": {
            get: {
                tags: ["Drivers"],
                summary: "List all drivers",
                parameters: [{ $ref: "#/components/parameters/limit" }, { $ref: "#/components/parameters/offset" }],
                responses: { "200": { description: "List of drivers" } },
            },
        },
        "/v1/drivers/{id}": {
            get: {
                tags: ["Drivers"],
                summary: "Get a single driver",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string", example: "max-verstappen" } },
                    { $ref: "#/components/parameters/lang" },
                ],
                responses: { "200": { description: "Driver details", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Driver" } } } } } }, "404": { description: "Not found" } },
            },
        },
        "/v1/drivers/{id}/results": {
            get: {
                tags: ["Drivers"],
                summary: "Get all race results of a driver",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string", example: "lewis-hamilton" } },
                    { $ref: "#/components/parameters/limit" },
                    { $ref: "#/components/parameters/offset" },
                ],
                responses: { "200": { description: "Career race results" } },
            },
        },
        "/v1/drivers/{id}/seasons": {
            get: {
                tags: ["Drivers"],
                summary: "List all seasons a driver competed in",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "fernando-alonso" } }],
                responses: { "200": { description: "Array of years" } },
            },
        },
        "/v1/drivers/{id}/stats": {
            get: {
                tags: ["Drivers"],
                summary: "Aggregated career stats for a driver",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "michael-schumacher" } }],
                responses: { "200": { description: "Career stats", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/DriverStats" } } } } } } },
            },
        },
        "/v1/constructors": {
            get: {
                tags: ["Constructors"],
                summary: "List all constructors",
                parameters: [{ $ref: "#/components/parameters/limit" }, { $ref: "#/components/parameters/offset" }],
                responses: { "200": { description: "List of constructors" } },
            },
        },
        "/v1/constructors/{id}": {
            get: {
                tags: ["Constructors"],
                summary: "Get a single constructor",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string", example: "ferrari" } },
                    { $ref: "#/components/parameters/lang" },
                ],
                responses: { "200": { description: "Constructor details" } },
            },
        },
        "/v1/constructors/{id}/results": {
            get: {
                tags: ["Constructors"],
                summary: "Results of a constructor across all races",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "ferrari" } }],
                responses: { "200": { description: "Race results" } },
            },
        },
        "/v1/constructors/{id}/stats": {
            get: {
                tags: ["Constructors"],
                summary: "Aggregated stats for a constructor",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "mclaren" } }],
                responses: { "200": { description: "Aggregate stats" } },
            },
        },
        "/v1/circuits": {
            get: {
                tags: ["Circuits"],
                summary: "List all circuits",
                parameters: [{ $ref: "#/components/parameters/limit" }, { $ref: "#/components/parameters/offset" }],
                responses: { "200": { description: "List of circuits" } },
            },
        },
        "/v1/circuits/{id}": {
            get: {
                tags: ["Circuits"],
                summary: "Get a single circuit",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string", example: "monza" } },
                    { $ref: "#/components/parameters/lang" },
                ],
                responses: { "200": { description: "Circuit details" } },
            },
        },
        "/v1/circuits/{id}/races": {
            get: {
                tags: ["Circuits"],
                summary: "All races held at a circuit",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "monaco" } }],
                responses: { "200": { description: "Historical races" } },
            },
        },
        "/v1/champions": {
            get: {
                tags: ["Champions"],
                summary: "All world champions (drivers + constructors by year)",
                responses: { "200": { description: "Year-by-year champions", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Champion" } } } } } } } },
            },
        },
        "/v1/champions/drivers": {
            get: {
                tags: ["Champions"],
                summary: "Driver champions only",
                responses: { "200": { description: "Driver champions by year" } },
            },
        },
        "/v1/champions/constructors": {
            get: {
                tags: ["Champions"],
                summary: "Constructor champions only",
                responses: { "200": { description: "Constructor champions by year" } },
            },
        },
        "/v1/rivalries": {
            get: {
                tags: ["Rivalries"],
                summary: "List curated rivalries",
                parameters: [{ $ref: "#/components/parameters/limit" }, { $ref: "#/components/parameters/offset" }],
                responses: { "200": { description: "Rivalries" } },
            },
        },
        "/v1/rivalries/{id}": {
            get: {
                tags: ["Rivalries"],
                summary: "Get a rivalry with key races",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string", example: "senna-vs-prost" } },
                    { $ref: "#/components/parameters/lang" },
                ],
                responses: { "200": { description: "Rivalry details", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Rivalry" } } } } } } },
            },
        },
        "/v1/records": {
            get: {
                tags: ["Records"],
                summary: "All records",
                responses: { "200": { description: "Records" } },
            },
        },
        "/v1/records/{category}": {
            get: {
                tags: ["Records"],
                summary: "Records filtered by category",
                parameters: [{ name: "category", in: "path", required: true, schema: { type: "string", enum: ["driver", "constructor", "race"] } }],
                responses: { "200": { description: "Records in category" } },
            },
        },
    },
} as const;