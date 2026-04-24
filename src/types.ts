export type Env = {
    DB: D1Database;
    ASSETS: R2Bucket;
    ENVIRONMENT: "development" | "production";
    API_RATE_LIMITER: {
        limit: (opts: { key: string }) => Promise<{ success: boolean }>;
    };
};

export type Lang = "en" | "es";

export type Pagination = {
    limit: number;
    offset: number;
};