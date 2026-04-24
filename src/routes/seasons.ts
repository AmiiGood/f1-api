import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc, asc } from "drizzle-orm";
import type { Env, Lang, Pagination } from "../types";
import { seasons, races, driverStandings, constructorStandings } from "../db/schema";
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

    const rows = await db.select().from(seasons).orderBy(desc(seasons.year)).limit(limit).offset(offset);
    const total = await db.$count(seasons);

    return c.json({ data: rows, pagination: { limit, offset, total } });
});

app.get("/:year", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const year = parseInt(c.req.param("year"));
    const lang = c.var.lang;

    const [season] = await db.select().from(seasons).where(eq(seasons.year, year));
    if (!season) throw notFound("Season", String(year));

    const t = await getEntityTranslations(db, "season", String(year), lang);

    return c.json({ data: { ...season, summary: t.summary ?? null } });
});

app.get("/:year/races", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const year = parseInt(c.req.param("year"));

    const rows = await db.select().from(races).where(eq(races.season, year)).orderBy(asc(races.round));

    return c.json({ data: rows });
});

app.get("/:year/standings/drivers", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const year = parseInt(c.req.param("year"));
    const roundParam = c.req.query("round");

    let round: number;
    if (roundParam) {
        round = parseInt(roundParam);
    } else {
        const [last] = await db
            .select({ round: driverStandings.round })
            .from(driverStandings)
            .where(eq(driverStandings.season, year))
            .orderBy(desc(driverStandings.round))
            .limit(1);
        if (!last) throw notFound("Standings for season", String(year));
        round = last.round;
    }

    const rows = await db
        .select()
        .from(driverStandings)
        .where(and(eq(driverStandings.season, year), eq(driverStandings.round, round)))
        .orderBy(asc(driverStandings.position));

    return c.json({ data: rows, season: year, round });
});

app.get("/:year/standings/constructors", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const year = parseInt(c.req.param("year"));
    const roundParam = c.req.query("round");

    let round: number;
    if (roundParam) {
        round = parseInt(roundParam);
    } else {
        const [last] = await db
            .select({ round: constructorStandings.round })
            .from(constructorStandings)
            .where(eq(constructorStandings.season, year))
            .orderBy(desc(constructorStandings.round))
            .limit(1);
        if (!last) throw notFound("Standings for season", String(year));
        round = last.round;
    }

    const rows = await db
        .select()
        .from(constructorStandings)
        .where(and(eq(constructorStandings.season, year), eq(constructorStandings.round, round)))
        .orderBy(asc(constructorStandings.position));

    return c.json({ data: rows, season: year, round });
});

export default app;