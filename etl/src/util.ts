export function slug(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function sqlEscape(v: unknown): string {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return v ? "1" : "0";
    return `'${String(v).replace(/'/g, "''")}'`;
}

export function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

export function timeToMs(time?: string | null): number | null {
    if (!time) return null;
    // "1:27:33.456" or "+1.234" or "1:23.456"
    if (time.startsWith("+")) return null;
    const parts = time.split(":");
    let ms = 0;
    if (parts.length === 3) {
        ms += parseInt(parts[0]) * 3600_000;
        ms += parseInt(parts[1]) * 60_000;
        ms += parseFloat(parts[2]) * 1000;
    } else if (parts.length === 2) {
        ms += parseInt(parts[0]) * 60_000;
        ms += parseFloat(parts[1]) * 1000;
    } else {
        ms += parseFloat(parts[0]) * 1000;
    }
    return Math.round(ms);
}

export function normalizeId(id: string): string {
    return id.toLowerCase().replace(/_/g, "-");
}