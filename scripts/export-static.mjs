import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist");

const files = [
  "index.html",
  "study.html",
  "css/home.css",
  "css/style.css",
  "css/study.css",
  "js/main.js",
  "js/study.js",
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const relativePath of files) {
  const source = path.join(root, relativePath);
  const target = path.join(outDir, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      found.push(path.relative(outDir, fullPath).split(path.sep).join("/"));
    }
  }
  return found;
}

const published = (await walk(outDir)).sort();
const expected = [...files].sort();
if (published.join("\n") !== expected.join("\n")) {
  throw new Error(
    `dist contents do not match the public allowlist.\nexpected:\n${expected.join("\n")}\nactual:\n${published.join("\n")}`,
  );
}

let bytes = 0;
for (const relativePath of published) {
  bytes += (await stat(path.join(outDir, relativePath))).size;
}

console.log(`Exported ${published.length} static files (${bytes} bytes) to dist/`);
for (const relativePath of published) {
  console.log(`  ${relativePath}`);
}
