# Nael Ventures: Netlify to Cloudflare

This prepares the existing static site for Cloudflare. It does not deploy, change DNS, or remove the live Netlify site.

## Baseline

Production and `main` are the same commit:

`65fea319c6439792f9fe7ab5c6c4d45c995fc8f2` (`65fea31`, message `Fixed "Lines"`, dated Thu Apr 23 2026 -0600)

There is no diff between current `main` and that commit. Git history has only `index.html`, `study.html`, `css/`, `js/`, and `serve.bat`. There has never been a `netlify.toml`, `_redirects`, `_headers`, function, or edge function in this repository.

The site is hand-written HTML, CSS, and JavaScript. There is no framework, package build, API, database, auth, or form backend. `study.html` chat and devotionals run entirely in the browser. The only external requests the pages make are Google Fonts and Unsplash images, plus a `mailto:` link and an outbound TikTok link.

Required runtime environment variables: none.

## Live Netlify behavior checked

`https://naelventures.netlify.app` serves this commit. `index.html`, both stylesheets, and both scripts match the repository bytes. `study.html` matches except Netlify rewrites the back link from `href="index.html"` to `href='/'` as it serves the file. This repo keeps the source link. On Cloudflare, `/index.html` redirects to `/`, so the link still opens Home.

Pretty URLs on Netlify: `/study` and `/study.html` return 200, and `/study/` returns 301 to `/study`. `/STUDY` returns 301 to `/study`. Missing paths return 404. `serve.bat` is publicly downloadable. Cache-Control is `public, max-age=0, must-revalidate`.

Public DNS, checked read-only and not changed:

- Nameservers: `curitiba.ns.porkbun.com`, `fortaleza.ns.porkbun.com`, `maceio.ns.porkbun.com`, `salvador.ns.porkbun.com`
- Apex A: `75.2.60.5`, `99.83.231.61` (Netlify)
- `www` is NXDOMAIN
- No public AAAA, MX, TXT, CAA, or DS records were observed
- `https://naelventures.com` fails normal TLS validation. The certificate is `CN=*.netlify.app` with SAN `netlify.app` only
- `http://naelventures.com` returns 301 to `https://naelventures.com/`
- `https://naelventures.netlify.app` is the healthy copy

The Netlify dashboard can say `www` redirects to the apex. Public DNS has no `www` record, so that redirect does not work today. Do not create `www` during the first cutover.

## Hosting choice

Use Workers with Workers Static Assets, and do not add a Worker script.

Static asset requests are free and unlimited on both Workers plans, and asset storage has no extra charge. Worker script requests are the requests that count against the Free plan's 100,000 requests per day and against Paid plan usage. This site has nothing for a script to do. The config therefore has no `main`, no asset binding, and no `run_worker_first`. Workers Cache stays off, because enabling it bills static asset requests as Worker requests.

Wrangler 4.158.0 still packages its own `templates/no-op-worker.js` (about 313 bytes) on an assets-only deploy, because its upload form includes a module. That file is not site content. Locally, missing paths returned an empty 404 rather than that module's "Not found" page, which is the asset handler answering. Official billing says a request served as a static asset does not invoke the Worker. Do not add a user script later unless you mean to start counting those requests.

That stays at zero script cost whether the account is Free or Paid. The account plan was not readable from here. Free-plan static asset limits are 20,000 files and 25 MiB each. This output is 6 files and about 58 KB.

Pages is not a better fit. Nothing in the site uses Pages Functions, Forms, or Identity. Pages static requests are also free, but a new site should use Workers Static Assets, and the later cutover already requires a Cloudflare zone, which is what a Worker custom domain needs.

Do not connect Workers Builds for the first test. Builds include 3,000 minutes per month on the Free plan, but a Git connection can deploy on push. The first publish should be one explicit `wrangler deploy` to `workers.dev`.

Official sources:

- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/
- https://developers.cloudflare.com/workers/static-assets/direct-upload/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/authorization/workers/
- https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
- https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/

## What gets published

`npm run build` copies only these files into `dist/`:

- `index.html`
- `study.html`
- `css/style.css`
- `css/study.css`
- `js/main.js`
- `js/study.js`

`wrangler.jsonc` serves `dist/`, not the repository root. `serve.bat`, docs, scripts, and package metadata are not in the asset directory. `.netlifyignore` excludes that same tooling if this branch is later published by Netlify from the repository root, so the current Netlify file set does not gain the Cloudflare config. Do not merge this branch as part of the Cloudflare test.

`html_handling` is `auto-trailing-slash`. `/study` returns 200 and `/study.html` and `/study/` redirect to `/study` with 307. Netlify returns 200 for `/study.html` and 301 for `/study/`. `/STUDY` stays 404 here; Netlify redirects it. Matching that case redirect would require a Worker script, which this config avoids.

`not_found_handling` is `none`, so unknown paths return 404 instead of the homepage. No custom headers or redirects are required. Cloudflare's default static asset `Cache-Control` is already `public, max-age=0, must-revalidate`.

No custom domain or route is in the config. A deploy cannot attach `naelventures.com`.

## Reproduce locally

```sh
npm ci
npm run build
npm run manifest
npm run check
npm run dev
```

`npm run dev` is `wrangler dev --latest false` and listens on `http://127.0.0.1:8787`. In another shell:

```sh
node scripts/smoke-http.mjs http://127.0.0.1:8787
```

`npm run check` is a local dry run. It does not upload.

## Parent deploy to workers.dev

Do this only from the Cloudflare account that should own the site. Do not pass a token on the command line. Use Wrangler OAuth (`npx wrangler login`) or an environment variable named `CLOUDFLARE_API_TOKEN`. The account id, if Wrangler cannot see it, is `CLOUDFLARE_ACCOUNT_ID`. Neither value belongs in the repo.

The first deploy creates the Worker, so the token needs product-level Workers Admin. Later deploys of this same Worker need Editor. Do not grant Workers Routes Write for this test. There are no bindings and no site environment variables.

```sh
npm ci
npm run build
npx wrangler deploy --autoconfig false
```

Wrangler prints the `workers.dev` URL. Confirm `/`, `/study`, `/css/style.css`, `/js/main.js`, a 404, and that `/serve.bat` is 404 before any DNS change. Leave Porkbun and the Netlify site as they are.

## API upload, if Wrangler is not used

Pinned Wrangler 4.158.0 is the client this repo matches. Its asset hash is the first 32 hex characters of BLAKE3 over `base64(file bytes) + extension`, with no dot in the extension. `npm run manifest` prints that manifest. Paths start with `/` and `size` is the raw byte length. The public direct-upload example currently shows SHA-256 of that same string; do not send those SHA-256 hashes to the upload session. A SHA-256 of the raw file is included in the manifest only as a checksum.

1. `POST /client/v4/accounts/{account_id}/workers/scripts/naelventures/assets-upload-session` with `{"manifest": { "/index.html": { "hash": "...", "size": 10949 } }}`. The response `jwt` lasts one hour. `buckets` lists the hashes still to upload. An empty `buckets` array means the `jwt` is already the completion token.
2. For each bucket, `POST /client/v4/accounts/{account_id}/workers/assets/upload?base64=true` with `Authorization: Bearer <upload jwt>` and `multipart/form-data`. Each part name is the hash and the body is standard base64 file bytes. Set the part `Content-Type` to the type Wrangler serves: `text/html; charset=utf-8`, `text/css; charset=utf-8`, or `text/javascript; charset=utf-8`. The final upload returns 201 and a completion `jwt`, also valid for one hour.
3. `PUT /client/v4/accounts/{account_id}/workers/scripts/naelventures` as multipart. The `metadata` part is JSON. Prefer `npx wrangler deploy --autoconfig false` for this step: it attaches the completion token, the asset config below, and Wrangler's no-op module. A hand-built API call must not add routes, bindings, or a user script. The direct-upload guide's metadata sample includes `main_module` and, in one snippet, is missing the colon after `"config"`. Use this object if the API accepts a version with no user module:

```json
{
  "compatibility_date": "2026-11-06",
  "workers_dev": true,
  "observability": {
    "enabled": true,
    "logs": { "enabled": true, "head_sampling_rate": 1 },
    "traces": { "enabled": true, "head_sampling_rate": 1 }
  },
  "assets": {
    "jwt": "<completion_token>",
    "config": {
      "html_handling": "auto-trailing-slash",
      "not_found_handling": "none"
    }
  }
}
```

Creating the script the first time needs product-level Workers Admin. The token must not be placed in the shell history if it can be avoided; prefer a Wrangler login for the first test. This preparation did not call the Cloudflare API. If a no-module metadata upload is rejected, deploy with Wrangler instead of inventing a site script.

There is no favicon in the repository. Browsers request `/favicon.ico` and receive 404. That is existing content, not a new route.

## Cutover, only after the workers.dev test

1. Leave the Netlify site and its A records in place until the new URL is accepted.
2. Add the `naelventures.com` zone to the same Cloudflare account. Do not change Porkbun while the zone is pending.
3. When the test is accepted, replace the Porkbun nameservers with the two nameservers Cloudflare shows for the new zone. That is the moment public DNS moves.
4. After the zone is active, attach `naelventures.com` as a Worker custom domain from the dashboard. Cloudflare creates the DNS record and certificate. A custom domain requires a zone on the account. Do not put that route in `wrangler.jsonc` until a later deploy is supposed to keep managing it.
5. Turn on Always Use HTTPS for the zone after the certificate validates. Check `https://naelventures.com` with a normal TLS client before enabling HSTS. Do not copy Netlify's preload HSTS onto the zone while the apex certificate is still the `*.netlify.app` certificate.
6. Leave `www` unset. It does not resolve today. Adding it would be a new public name. A later redirect, if wanted, is a zone redirect rule from `www.naelventures.com` to `https://naelventures.com`, plus a proxied DNS record. It is not a static-asset rule.
7. Keep the Netlify site until the apex has been stable. `https://naelventures.netlify.app` remains the rollback copy.

## Rollback

Before nameservers change, rollback is "do not attach the domain." The live site is untouched. A bad Worker version can be replaced with `npx wrangler rollback`. That rolls back the Worker version only. It does not restore DNS, certificates, or Porkbun, and this project has no attached data to restore.

After nameservers have changed:

1. In Porkbun, set the nameservers back to `curitiba.ns.porkbun.com`, `fortaleza.ns.porkbun.com`, `maceio.ns.porkbun.com`, and `salvador.ns.porkbun.com`.
2. Do not delete the Porkbun A records `75.2.60.5` and `99.83.231.61` before that switch. They become authoritative again when Porkbun is the nameserver.
3. Do not delete the Netlify site.
4. Expect the apex to return to its current state, including the hostname-mismatched Netlify certificate. The healthy URL during that rollback is `https://naelventures.netlify.app`.
