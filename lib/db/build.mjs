import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

execSync("pnpm exec tsc -p tsconfig.build.json", {
  cwd: __dirname,
  stdio: "inherit",
});
