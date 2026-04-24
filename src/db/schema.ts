import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";

export const drivers = sqliteTable("drivers", {
    id: text("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    fullName: text("full_name").notNull(),
    code: text("code"),
    permanentNumber: integer("permanent_number"),
    nationality: text("nationality").notNull(),
    dateOfBirth: text("date_of_birth"),
    dateOfDeath: text("date_of_death"),
    placeOfBirth: text("place_of_birth"),
    status: text("status", { enum: ["active", "retired", "deceased"] }).notNull(),
    imageUrl: text("image_url"),
    wikipediaUrl: text("wikipedia_url"),
}, (t) => ({
    nationalityIdx: index("idx_drivers_nationality").on(t.nationality),
    statusIdx: index("idx_drivers_status").on(t.status),
}));

export const constructors = sqliteTable("constructors", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    nationality: text("nationality").notNull(),
    baseLocation: text("base_location"),
    foundedYear: integer("founded_year"),
    firstEntryYear: integer("first_entry_year"),
    lastEntryYear: integer("last_entry_year"),
    founder: text("founder"),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color"),
    secondaryColor: text("secondary_color"),
    wikipediaUrl: text("wikipedia_url"),
});

export const circuits = sqliteTable("circuits", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    country: text("country").notNull(),
    city: text("city"),
    lengthKm: real("length_km"),
    turns: integer("turns"),
    lapRecordTime: text("lap_record_time"),
    lapRecordDriverId: text("lap_record_driver_id").references(() => drivers.id),
    lapRecordYear: integer("lap_record_year"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    layoutSvgUrl: text("layout_svg_url"),
    photoUrl: text("photo_url"),
    wikipediaUrl: text("wikipedia_url"),
});

export const seasons = sqliteTable("seasons", {
    year: integer("year").primaryKey(),
    championDriverId: text("champion_driver_id").references(() => drivers.id),
    championConstructorId: text("champion_constructor_id").references(() => constructors.id),
    totalRaces: integer("total_races").notNull(),
    regulationEra: text("regulation_era"),
});

export const races = sqliteTable("races", {
    id: text("id").primaryKey(),
    season: integer("season").notNull().references(() => seasons.year),
    round: integer("round").notNull(),
    name: text("name").notNull(),
    officialName: text("official_name"),
    circuitId: text("circuit_id").notNull().references(() => circuits.id),
    date: text("date").notNull(),
    timeUtc: text("time_utc"),
    weather: text("weather"),
    hasSprint: integer("has_sprint", { mode: "boolean" }).default(false),
}, (t) => ({
    seasonIdx: index("idx_races_season").on(t.season),
    circuitIdx: index("idx_races_circuit").on(t.circuitId),
}));

export const results = sqliteTable("results", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    raceId: text("race_id").notNull().references(() => races.id),
    driverId: text("driver_id").notNull().references(() => drivers.id),
    constructorId: text("constructor_id").notNull().references(() => constructors.id),
    position: integer("position"),
    positionText: text("position_text").notNull(),
    grid: integer("grid"),
    laps: integer("laps"),
    timeMs: integer("time_ms"),
    status: text("status").notNull(),
    points: real("points").notNull().default(0),
    fastestLap: integer("fastest_lap", { mode: "boolean" }).default(false),
    fastestLapTime: text("fastest_lap_time"),
}, (t) => ({
    raceIdx: index("idx_results_race").on(t.raceId),
    driverIdx: index("idx_results_driver").on(t.driverId),
    constructorIdx: index("idx_results_constructor").on(t.constructorId),
}));

export const qualifying = sqliteTable("qualifying", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    raceId: text("race_id").notNull().references(() => races.id),
    driverId: text("driver_id").notNull().references(() => drivers.id),
    constructorId: text("constructor_id").notNull().references(() => constructors.id),
    position: integer("position").notNull(),
    q1Time: text("q1_time"),
    q2Time: text("q2_time"),
    q3Time: text("q3_time"),
}, (t) => ({
    raceIdx: index("idx_qualifying_race").on(t.raceId),
}));

export const driverStandings = sqliteTable("driver_standings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    season: integer("season").notNull().references(() => seasons.year),
    round: integer("round").notNull(),
    driverId: text("driver_id").notNull().references(() => drivers.id),
    constructorId: text("constructor_id").notNull().references(() => constructors.id),
    position: integer("position").notNull(),
    points: real("points").notNull(),
    wins: integer("wins").notNull().default(0),
}, (t) => ({
    seasonRoundIdx: index("idx_ds_season_round").on(t.season, t.round),
    driverIdx: index("idx_ds_driver").on(t.driverId),
}));

export const constructorStandings = sqliteTable("constructor_standings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    season: integer("season").notNull().references(() => seasons.year),
    round: integer("round").notNull(),
    constructorId: text("constructor_id").notNull().references(() => constructors.id),
    position: integer("position").notNull(),
    points: real("points").notNull(),
    wins: integer("wins").notNull().default(0),
}, (t) => ({
    seasonRoundIdx: index("idx_cs_season_round").on(t.season, t.round),
}));

export const rivalries = sqliteTable("rivalries", {
    id: text("id").primaryKey(),
    driverAId: text("driver_a_id").notNull().references(() => drivers.id),
    driverBId: text("driver_b_id").notNull().references(() => drivers.id),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year"),
    era: text("era"),
    intensity: text("intensity", { enum: ["legendary", "intense", "notable"] }),
});

export const rivalryKeyRaces = sqliteTable("rivalry_key_races", {
    rivalryId: text("rivalry_id").notNull().references(() => rivalries.id),
    raceId: text("race_id").notNull().references(() => races.id),
}, (t) => ({
    pk: primaryKey({ columns: [t.rivalryId, t.raceId] }),
}));

export const records = sqliteTable("records", {
    id: text("id").primaryKey(),
    category: text("category", { enum: ["driver", "constructor", "race"] }).notNull(),
    metric: text("metric").notNull(),
    holderType: text("holder_type", { enum: ["driver", "constructor"] }).notNull(),
    holderId: text("holder_id").notNull(),
    value: real("value").notNull(),
    dateSet: text("date_set"),
    stillActive: integer("still_active", { mode: "boolean" }).default(true),
}, (t) => ({
    categoryIdx: index("idx_records_category").on(t.category),
    metricIdx: index("idx_records_metric").on(t.metric),
}));

export const translations = sqliteTable("translations", {
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field").notNull(),
    lang: text("lang", { enum: ["en", "es"] }).notNull(),
    value: text("value").notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.entityType, t.entityId, t.field, t.lang] }),
    lookupIdx: index("idx_translations_lookup").on(t.entityType, t.entityId, t.lang),
}));