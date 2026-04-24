import { createMiddleware } from "hono/factory";
import type { Env } from "../types";

export const rateLimit = createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const ip =
        c.req.header("cf-connecting-ip") ??
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";

    if (ip === "unknown") {
        await next();
        return;
    }

    const { success } = await c.env.API_RATE_LIMITER.limit({ key: ip });

    if (!success) {
        c.header("Retry-After", "60");
        return c.json(
            {
                error: {
                    code: 429,
                    message: "Rate limit exceeded. Maximum 60 requests per minute per IP. Please cache responses or slow down.",
                },
            },
            429
        );
    }

    await next();
});