import { createMiddleware } from "hono/factory";
import type { Pagination } from "../types";

export const paginationMiddleware = createMiddleware<{ Variables: { pagination: Pagination } }>(
    async (c, next) => {
        const limit = Math.min(Math.max(parseInt(c.req.query("limit") ?? "20"), 1), 100);
        const offset = Math.max(parseInt(c.req.query("offset") ?? "0"), 0);
        c.set("pagination", { limit, offset });
        await next();
    }
);