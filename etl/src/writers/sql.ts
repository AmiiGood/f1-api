import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUTPUT_DIR = "output";

export async function writeSQL(filename: string, sql: string): Promise<string> {
    await mkdir(OUTPUT_DIR, { recursive: true });
    const path = join(OUTPUT_DIR, filename);
    await writeFile(path, sql + "\n", "utf-8");
    return path;
}