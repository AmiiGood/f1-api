import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, sql, countDistinct } from "drizzle-orm";
import type { Env, Lang, Pagination } from "../types";
import { drivers, results, races } from "../db/schema";
import { paginationMiddleware } from "../middleware/pagination";
import { cacheControl, HISTORIC_CACHE } from "../middleware/cache";
import { getEntityTranslations } from "../lib/translations";
import { notFound } from "../lib/errors";

const app = new Hono<{
    Bindings: Env;
    Variables: { lang: Lang; pagination: Pagination };
}>();

app.get("/", paginationMiddleware, cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const { limit, offset } = c.var.pagination;

    const rows = await db.select().from(drivers).limit(limit).offset(offset);
    const total = await db.$count(drivers);

    return c.json({ data: rows, pagination: { limit, offset, total } });
});

app.get("/:id", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");
    const lang = c.var.lang;

    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    if (!driver) throw notFound("Driver", id);

    const t = await getEntityTranslations(db, "driver", id, lang);

    return c.json({ data: { ...driver, bio: t.bio ?? null } });
});

app.get("/:id/results", paginationMiddleware, cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");
    const { limit, offset } = c.var.pagination;

    const rows = await db
        .select({
            raceId: results.raceId,
            raceName: races.name,
            season: races.season,
            round: races.round,
            date: races.date,
            position: results.position,
            positionText: results.positionText,
            grid: results.grid,
            points: results.points,
            status: results.status,
            constructorId: results.constructorId,
        })
        .from(results)
        .innerJoin(races, eq(results.raceId, races.id))
        .where(eq(results.driverId, id))
        .orderBy(desc(races.date))
        .limit(limit)
        .offset(offset);

    return c.json({ data: rows, pagination: { limit, offset } });
});

app.get("/:id/seasons", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const rows = await db
        .selectDistinct({ season: races.season })
        .from(results)
        .innerJoin(races, eq(results.raceId, races.id))
        .where(eq(results.driverId, id))
        .orderBy(desc(races.season));

    return c.json({ data: rows.map((r) => r.season) });
});

app.get("/:id/stats", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const [stats] = await db
        .select({
            races: countDistinct(results.raceId),
            wins: sql<number>`SUM(CASE WHEN ${results.position} = 1 THEN 1 ELSE 0 END)`,
            podiums: sql<number>`SUM(CASE WHEN ${results.position} <= 3 THEN 1 ELSE 0 END)`,
            points: sql<number>`COALESCE(SUM(${results.points}), 0)`,
            fastestLaps: sql<number>`SUM(CASE WHEN ${results.fastestLap} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(results)
        .where(eq(results.driverId, id));

    return c.json({ data: stats });
});

export default app;