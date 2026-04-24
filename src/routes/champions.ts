import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, isNotNull, asc } from "drizzle-orm";
import type { Env, Lang } from "../types";
import { seasons, drivers, constructors } from "../db/schema";
import { cacheControl, HISTORIC_CACHE } from "../middleware/cache";

const app = new Hono<{ Bindings: Env; Variables: { lang: Lang } }>();

app.get("/", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);

    const rows = await db
        .select({
            year: seasons.year,
            driverId: seasons.championDriverId,
            driverName: drivers.fullName,
            constructorId: seasons.championConstructorId,
            constructorName: constructors.shortName,
        })
        .from(seasons)
        .leftJoin(drivers, eq(seasons.championDriverId, drivers.id))
        .leftJoin(constructors, eq(seasons.championConstructorId, constructors.id))
        .where(isNotNull(seasons.championDriverId))
        .orderBy(asc(seasons.year));

    return c.json({ data: rows });
});

app.get("/drivers", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);

    const rows = await db
        .select({
            year: seasons.year,
            driverId: seasons.championDriverId,
            driverName: drivers.fullName,
            nationality: drivers.nationality,
        })
        .from(seasons)
        .innerJoin(drivers, eq(seasons.championDriverId, drivers.id))
        .orderBy(asc(seasons.year));

    return c.json({ data: rows });
});

app.get("/constructors", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);

    const rows = await db
        .select({
            year: seasons.year,
            constructorId: seasons.championConstructorId,
            constructorName: constructors.shortName,
            nationality: constructors.nationality,
        })
        .from(seasons)
        .innerJoin(constructors, eq(seasons.championConstructorId, constructors.id))
        .orderBy(asc(seasons.year));

    return c.json({ data: rows });
});

export default app;