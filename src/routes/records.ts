import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import type { Env, Lang } from "../types";
import { records } from "../db/schema";
import { cacheControl, HISTORIC_CACHE } from "../middleware/cache";

const app = new Hono<{ Bindings: Env; Variables: { lang: Lang } }>();

app.get("/", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const rows = await db.select().from(records);
    return c.json({ data: rows });
});

app.get("/:category", cacheControl(HISTORIC_CACHE), async (c) => {
    const db = drizzle(c.env.DB);
    const category = c.req.param("category") as "driver" | "constructor" | "race";

    if (!["driver", "constructor", "race"].includes(category)) {
        return c.json({ error: { code: 400, message: "Invalid category" } }, 400);
    }

    const rows = await db.select().from(records).where(eq(records.category, category));
    return c.json({ data: rows });
});

export default app;