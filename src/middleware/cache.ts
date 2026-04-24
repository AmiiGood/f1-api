import { createMiddleware } from "hono/factory";

export const cacheControl = (maxAge: number) =>
    createMiddleware(async (c, next) => {
        await next();
        c.header("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge}`);
    });

// 1 día para datos históricos, 1h para datos de temporada en curso
export const HISTORIC_CACHE = 86400;
export const CURRENT_CACHE = 3600;