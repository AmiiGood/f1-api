import { readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";

const DB = "f1-api-db";
const outputDir = resolve("output");
const projectRoot = resolve("..");

const files = readdirSync(outputDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const f of files) {
  const absPath = join(outputDir, f);
  console.log(`→ applying ${f} (remote)`);
  execSync(`npx wrangler d1 execute ${DB} --remote -y --file="${absPath}"`, {
    stdio: "inherit",
    cwd: projectRoot,
  });
}
