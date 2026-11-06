import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const require = createRequire(path.join(root, "node_modules/wrangler/package.json"));
const blake3 = require("blake3-wasm");

// Wrangler 4.158.0 hashes static assets as the first 32 hex characters of
// BLAKE3(base64(fileBytes) + extensionWithoutDot). See hashFile in
// wrangler/wrangler-dist/cli.js (deploy-helpers hash.ts).
function assetHash(filePath, bytes) {
  const extension = path.extname(filePath).slice(1);
  return blake3.hash(Buffer.from(bytes).toString("base64") + extension).toString("hex").slice(0, 32);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

const manifest = {};
for (const fullPath of await walk(distDir)) {
  const bytes = await readFile(fullPath);
  const relativePath = path.relative(distDir, fullPath).split(path.sep).join("/");
  const fileStat = await stat(fullPath);
  manifest[`/${relativePath}`] = {
    hash: assetHash(relativePath, bytes),
    size: fileStat.size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

const ordered = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
process.stdout.write(`${JSON.stringify(ordered, null, 2)}\n`);
