const base = process.argv[2];
if (!base) {
  console.error("Usage: node scripts/smoke-http.mjs http://127.0.0.1:8787");
  process.exit(1);
}

const homeMarker = "A portfolio of businesses we own and operate";
const studyMarker = "Covenant Study";

const checks = [
  { path: "/", expect: 200, type: "text/html", body: homeMarker },
  { path: "/index.html", expect: 307, location: "/" },
  { path: "/study", expect: 200, type: "text/html", body: studyMarker },
  { path: "/study/", expect: 307, location: "/study" },
  { path: "/study.html", expect: 307, location: "/study" },
  { path: "/css/style.css", expect: 200, type: "text/css", body: "--bg:" },
  { path: "/css/study.css", expect: 200, type: "text/css", body: ".study-body" },
  { path: "/js/main.js", expect: 200, type: "javascript", body: "initViews" },
  { path: "/js/study.js", expect: 200, type: "javascript", body: "verseForToday" },
  { path: "/missing-page", expect: 404, notBody: homeMarker },
  { path: "/STUDY", expect: 404 },
  { path: "/serve.bat", expect: 404 },
  { path: "/wrangler.jsonc", expect: 404 },
  { path: "/package.json", expect: 404 },
  { path: "/.git/config", expect: 404 },
  { path: "/docs/cloudflare-migration.md", expect: 404 },
];

let failed = 0;
for (const check of checks) {
  const response = await fetch(new URL(check.path, base), { redirect: "manual" });
  const text = await response.text();
  const type = response.headers.get("content-type") || "";
  const location = response.headers.get("location") || "";
  const cache = response.headers.get("cache-control") || "";
  const problems = [];
  if (response.status !== check.expect) problems.push(`status ${response.status} != ${check.expect}`);
  if (check.type && !type.includes(check.type)) problems.push(`content-type ${type || "(none)"}`);
  if (check.location && location !== check.location) problems.push(`location ${location || "(none)"} != ${check.location}`);
  if (check.body && !text.includes(check.body)) problems.push("body marker missing");
  if (check.notBody && text.includes(check.notBody)) problems.push("unexpected home document");
  if (check.expect === 200 && !cache.includes("max-age=0")) problems.push(`cache-control ${cache || "(none)"}`);
  const line = `${response.status} ${check.path} type=${type || "-"} location=${location || "-"}`;
  if (problems.length) {
    failed += 1;
    console.error(`FAIL ${line} :: ${problems.join("; ")}`);
  } else {
    console.log(`ok   ${line}`);
  }
}

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log(`All ${checks.length} checks passed`);
