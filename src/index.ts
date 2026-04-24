import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { apiReference } from "@scalar/hono-api-reference";
import type { Env } from "./types";
import { langMiddleware } from "./middleware/lang";

import seasons from "./routes/seasons";
import races from "./routes/races";
import drivers from "./routes/drivers";
import constructors from "./routes/constructors";
import circuits from "./routes/circuits";
import champions from "./routes/champions";
import rivalries from "./routes/rivalries";
import records from "./routes/records";
import { openApiSpec } from "./openapi";
import { rateLimit } from "./middleware/rateLimit";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors({ origin: "*", maxAge: 86400 }));
app.use("/v1/*", rateLimit);
app.use("/v1/*", langMiddleware);
app.use("/v1/*", async (c, next) => {
  const ua = c.req.header("user-agent")?.toLowerCase() ?? "";
  const blocked = ["curl/0", "scrapy", "wget/0", "python-requests/0", ""];
  if (blocked.some((b) => b && ua.includes(b))) {
  }
  if (!ua) {
    return c.json({ error: { code: 403, message: "User-Agent header required" } }, 403);
  }
  await next();
});
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

// OpenAPI spec
app.get("/openapi.json", (c) => {
  c.header("Cache-Control", "public, max-age=3600");
  return c.json(openApiSpec);
});

// Scalar UI playground
app.get(
  "/docs",
  apiReference({
    url: "/openapi.json",
    theme: "purple",
    layout: "modern",
    defaultHttpClient: { targetKey: "js", clientKey: "fetch" },
    hideDarkModeToggle: false,
    metaData: {
      title: "F1 API · Docs",
      description: "Free F1 historical data API",
    },
  })
);

// Root redirects to docs
app.get("/", (c) => c.redirect("/docs"));

// v1 routes
app.route("/v1/seasons", seasons);
app.route("/v1/races", races);
app.route("/v1/drivers", drivers);
app.route("/v1/constructors", constructors);
app.route("/v1/circuits", circuits);
app.route("/v1/champions", champions);
app.route("/v1/rivalries", rivalries);
app.route("/v1/records", records);

app.notFound((c) => c.json({ error: { code: 404, message: "Endpoint not found. See /docs" } }, 404));

app.onError((err, c) => {
  console.error(err);
  const status = "status" in err ? (err.status as 400 | 404 | 500) : 500;
  return c.json({ error: { code: status, message: err.message } }, status);
});

export default app;