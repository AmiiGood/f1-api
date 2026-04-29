import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, sql, countDistinct } from "drizzle-orm";
import type { Env, Lang, Pagination } from "../types";
import { constructors, results, races, sprintResults } from "../db/schema";
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

    const rows = await db.select().from(constructors).limit(limit).offset(offset);
    const total = await db.$count(constructors);

    return c.json({ data: rows, pagination: { limit, offset, total } });
});

app.get("/:id", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");
    const lang = c.var.lang;

    const [constructor] = await db.select().from(constructors).where(eq(constructors.id, id));
    if (!constructor) throw notFound("Constructor", id);

    const t = await getEntityTranslations(db, "constructor", id, lang);

    return c.json({ data: { ...constructor, description: t.description ?? null } });
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
            driverId: results.driverId,
            position: results.position,
            positionText: results.positionText,
            points: results.points,
        })
        .from(results)
        .innerJoin(races, eq(results.raceId, races.id))
        .where(eq(results.constructorId, id))
        .orderBy(desc(races.date))
        .limit(limit)
        .offset(offset);

    return c.json({ data: rows, pagination: { limit, offset } });
});

app.get("/:id/stats", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const [raceStats] = await db
        .select({
            races: countDistinct(results.raceId),
            wins: sql<number>`SUM(CASE WHEN ${results.position} = 1 THEN 1 ELSE 0 END)`,
            podiums: sql<number>`SUM(CASE WHEN ${results.position} <= 3 THEN 1 ELSE 0 END)`,
            points: sql<number>`COALESCE(SUM(${results.points}), 0)`,
        })
        .from(results)
        .where(eq(results.constructorId, id));

    const [sprintStats] = await db
        .select({
            races: countDistinct(sprintResults.raceId),
            wins: sql<number>`SUM(CASE WHEN ${sprintResults.position} = 1 THEN 1 ELSE 0 END)`,
            podiums: sql<number>`SUM(CASE WHEN ${sprintResults.position} <= 3 THEN 1 ELSE 0 END)`,
            points: sql<number>`COALESCE(SUM(${sprintResults.points}), 0)`,
        })
        .from(sprintResults)
        .where(eq(sprintResults.constructorId, id));

    return c.json({
        data: {
            race: raceStats,
            sprint: sprintStats,
            total: {
                wins: (raceStats?.wins ?? 0) + (sprintStats?.wins ?? 0),
                podiums: (raceStats?.podiums ?? 0) + (sprintStats?.podiums ?? 0),
                points: (raceStats?.points ?? 0) + (sprintStats?.points ?? 0),
            },
        },
    });
});

export default app;