import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, asc, desc } from "drizzle-orm";
import type { Env, Lang, Pagination } from "../types";
import { races, results, qualifying } from "../db/schema";
import { paginationMiddleware } from "../middleware/pagination";
import { cacheControl, HISTORIC_CACHE } from "../middleware/cache";
import { notFound } from "../lib/errors";

const app = new Hono<{
    Bindings: Env;
    Variables: { lang: Lang; pagination: Pagination };
}>();

app.get("/", paginationMiddleware, cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const { limit, offset } = c.var.pagination;
    const season = c.req.query("season");
    const circuit = c.req.query("circuit");

    const conditions = [];
    if (season) conditions.push(eq(races.season, parseInt(season)));
    if (circuit) conditions.push(eq(races.circuitId, circuit));

    const query = db.select().from(races).orderBy(desc(races.date)).limit(limit).offset(offset);
    const rows = conditions.length
        ? await query.where(conditions.length === 1 ? conditions[0] : (await import("drizzle-orm")).and(...conditions))
        : await query;

    const total = await db.$count(races);
    return c.json({ data: rows, pagination: { limit, offset, total } });
});

app.get("/:id", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const [race] = await db.select().from(races).where(eq(races.id, id));
    if (!race) throw notFound("Race", id);

    return c.json({ data: race });
});

app.get("/:id/results", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const rows = await db.select().from(results).where(eq(results.raceId, id)).orderBy(asc(results.position));
    return c.json({ data: rows });
});

app.get("/:id/qualifying", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const rows = await db.select().from(qualifying).where(eq(qualifying.raceId, id)).orderBy(asc(qualifying.position));
    return c.json({ data: rows });
});

export default app;