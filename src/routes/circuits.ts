import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import type { Env, Lang, Pagination } from "../types";
import { circuits, races } from "../db/schema";
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

    const rows = await db.select().from(circuits).limit(limit).offset(offset);
    const total = await db.$count(circuits);

    return c.json({ data: rows, pagination: { limit, offset, total } });
});

app.get("/:id", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");
    const lang = c.var.lang;

    const [circuit] = await db.select().from(circuits).where(eq(circuits.id, id));
    if (!circuit) throw notFound("Circuit", id);

    const t = await getEntityTranslations(db, "circuit", id, lang);

    return c.json({ data: { ...circuit, description: t.description ?? null } });
});

app.get("/:id/races", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const rows = await db.select().from(races).where(eq(races.circuitId, id)).orderBy(desc(races.date));

    return c.json({ data: rows });
});

export default app;