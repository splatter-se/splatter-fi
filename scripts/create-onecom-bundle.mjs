import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const output = resolve(root, "onecom-bundle.zip");

if (!existsSync(dist)) {
  throw new Error("dist/ puuttuu. Suorita ensin npm run build.");
}

if (existsSync(output)) rmSync(output);
execFileSync("zip", ["-qr", output, "."], { cwd: dist, stdio: "inherit" });
console.log(output);
