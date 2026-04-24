import { and, eq, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { translations } from "../db/schema";
import type { Lang } from "../types";

export async function getTranslations(
    db: DrizzleD1Database,
    entityType: string,
    entityIds: string[],
    lang: Lang
) {
    if (entityIds.length === 0) return new Map<string, Record<string, string>>();

    const rows = await db
        .select()
        .from(translations)
        .where(
            and(
                eq(translations.entityType, entityType),
                eq(translations.lang, lang),
                inArray(translations.entityId, entityIds)
            )
        );

    const map = new Map<string, Record<string, string>>();
    for (const row of rows) {
        const existing = map.get(row.entityId) ?? {};
        existing[row.field] = row.value;
        map.set(row.entityId, existing);
    }
    return map;
}

export async function getEntityTranslations(
    db: DrizzleD1Database,
    entityType: string,
    entityId: string,
    lang: Lang
): Promise<Record<string, string>> {
    const map = await getTranslations(db, entityType, [entityId], lang);
    return map.get(entityId) ?? {};
}