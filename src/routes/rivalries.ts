import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, inArray } from "drizzle-orm";
import type { Env, Lang, Pagination } from "../types";
import { rivalries, rivalryKeyRaces, races, translations } from "../db/schema";
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

    const rows = await db.select().from(rivalries).limit(limit).offset(offset);
    const total = await db.$count(rivalries);

    return c.json({ data: rows, pagination: { limit, offset, total } });
});

app.get("/:id", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");
    const lang = c.var.lang;

    const [rivalry] = await db.select().from(rivalries).where(eq(rivalries.id, id));
    if (!rivalry) throw notFound("Rivalry", id);

    const keyRaceRows = await db
        .select({
            raceId: rivalryKeyRaces.raceId,
            raceName: races.name,
            season: races.season,
            date: races.date,
        })
        .from(rivalryKeyRaces)
        .innerJoin(races, eq(rivalryKeyRaces.raceId, races.id))
        .where(eq(rivalryKeyRaces.rivalryId, id));

    // significance translations per key race
    const raceIds = keyRaceRows.map((r) => r.raceId);
    const sigRows = raceIds.length
        ? await db
            .select()
            .from(translations)
            .where(
                and(
                    eq(translations.entityType, "rivalry_key_race"),
                    eq(translations.lang, lang),
                    inArray(translations.entityId, raceIds.map((r) => `${id}:${r}`))
                )
            )
        : [];

    const sigMap = new Map(sigRows.map((s) => [s.entityId, s.value]));
    const keyRaces = keyRaceRows.map((kr) => ({
        ...kr,
        significance: sigMap.get(`${id}:${kr.raceId}`) ?? null,
    }));

    const t = await getEntityTranslations(db, "rivalry", id, lang);

    return c.json({
        data: {
            ...rivalry,
            description: t.description ?? null,
            keyRaces,
        },
    });
});

export default app;