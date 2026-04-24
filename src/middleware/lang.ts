import { createMiddleware } from "hono/factory";
import type { Lang } from "../types";

export const langMiddleware = createMiddleware<{ Variables: { lang: Lang } }>(async (c, next) => {
    const queryLang = c.req.query("lang");
    const headerLang = c.req.header("accept-language")?.split(",")[0]?.split("-")[0];
    const lang: Lang = queryLang === "es" || headerLang === "es" ? "es" : "en";
    c.set("lang", lang);
    await next();
});