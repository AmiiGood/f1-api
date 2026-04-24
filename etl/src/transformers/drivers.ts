import { sqlEscape, normalizeId } from "../util.js";

export function driversToSQL(drivers: any[]): string {
    const lines: string[] = [];

    for (const d of drivers) {
        const id = normalizeId(d.driverId);
        const dob = d.dateOfBirth ?? null;
        const status: "active" | "retired" | "deceased" = "retired";
        const fullName = `${d.givenName ?? ""} ${d.familyName ?? ""}`.trim();

        lines.push(
            `INSERT INTO drivers (id, first_name, last_name, full_name, code, permanent_number, nationality, date_of_birth, place_of_birth, status, wikipedia_url) VALUES (` +
            [
                sqlEscape(id),
                sqlEscape(d.givenName ?? "Unknown"),
                sqlEscape(d.familyName ?? "Unknown"),
                sqlEscape(fullName || "Unknown"),
                sqlEscape(d.code ?? null),
                sqlEscape(d.permanentNumber ? parseInt(d.permanentNumber) : null),
                sqlEscape(d.nationality ?? "Unknown"),
                sqlEscape(dob),
                sqlEscape(null),
                sqlEscape(status),
                sqlEscape(d.url ?? null),
            ].join(", ") +
            `) ON CONFLICT(id) DO UPDATE SET ` +
            `first_name=excluded.first_name, last_name=excluded.last_name, full_name=excluded.full_name, ` +
            `code=excluded.code, permanent_number=excluded.permanent_number, nationality=excluded.nationality, ` +
            `date_of_birth=excluded.date_of_birth, wikipedia_url=excluded.wikipedia_url;`
        );
    }

    return lines.join("\n");
}