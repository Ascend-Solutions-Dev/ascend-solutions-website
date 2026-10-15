import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/", init, env = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html", ...init?.headers }, ...init }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, ...env }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the branded Ascend homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Ascend Solutions \| Technology Built for Families/);
  assert.match(html, /Practical apps for busy/);
  assert.match(html, /Family-first design/);
  assert.match(html, /ascend-long-light\.png/);
  assert.match(html, /data:image\/svg\+xml;base64,/);
  assert.match(html, /\/og\.png/);
  assert.match(html, /Skip to main content/);
  assert.match(html, /Open navigation menu/);
  assert.match(html, /mailto:info@ascendsolutions\.dev/);
  assert.doesNotMatch(html, /sales@ascendsolutions\.dev/);
  assert.doesNotMatch(html, /hello@ascendsolutions\.dev/);
  assert.match(html, /rel="canonical" href="https:\/\/ascendsolutions\.dev\/?"/);
});

test("renders the apps and legal routes", async () => {
  const [apps, legal] = await Promise.all([render("/apps"), render("/legal")]);
  assert.equal(apps.status, 200);
  assert.equal(legal.status, 200);
  const appsHtml = await apps.text();
  assert.match(appsHtml, /Tools built for real family life/);
  assert.match(appsHtml, /Kinlii/);
  assert.match(appsHtml, /data:image\/svg\+xml;base64,/);
  assert.match(appsHtml, /featured-coming/);
  assert.doesNotMatch(appsHtml, /Featured app · Coming soon/);
  assert.match(appsHtml, /<form[^>]+waitlist-form/);
  assert.match(appsHtml, /name="email"/);
  assert.match(appsHtml, /Family Apps \| Ascend Solutions/);
  assert.match(appsHtml, /rel="canonical" href="https:\/\/ascendsolutions\.dev\/apps"/);
  const legalHtml = await legal.text();
  assert.match(legalHtml, /Privacy Policy/);
  assert.match(legalHtml, /Legal \| Ascend Solutions/);
  assert.match(legalHtml, /rel="canonical" href="https:\/\/ascendsolutions\.dev\/legal"/);
});

test("validates waitlist submissions before accessing storage", async () => {
  const response = await render("/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email: "not-an-email", source: "pantrii" }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Enter a valid email address." });
});

test("protects the waitlist admin page and export", async () => {
  const apiResponse = await render("/api/admin/waitlist", {
    headers: { accept: "application/json" },
  });
  assert.equal(apiResponse.status, 401);
  assert.deepEqual(await apiResponse.json(), { error: "Sign in required." });

  const pageResponse = await render("/admin/waitlist");
  assert.equal(pageResponse.status, 200);
  const pageHtml = await pageResponse.text();
  assert.match(pageHtml, /Waitlist access/);
  assert.match(pageHtml, /Email me a sign-in link/);
  assert.doesNotMatch(pageHtml, /Download CSV/);
});

test("keeps magic-link email disabled until its secrets are configured", async () => {
  const response = await render("/api/admin/auth/request", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", origin: "http://localhost" },
    body: JSON.stringify({ email: "skyler@ascendsolutions.dev" }),
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Admin email sign-in is still being configured." });
});

test("ships the supplied brand assets", async () => {
  await Promise.all([
    access(new URL("../public/brand/ascend-icon.png", import.meta.url)),
    access(new URL("../public/brand/ascend-long-light.png", import.meta.url)),
    access(new URL("../public/brand/ascend-long-dark.png", import.meta.url)),
    access(new URL("../public/brand/pantrii-dark-icon.svg", import.meta.url)),
    access(new URL("../public/brand/pantrii-light-icon.svg", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /#ff8a00/i);
  assert.match(css, /#022b46/i);
  assert.match(css, /#c7e9ff/i);
  assert.match(css, /Bree Serif/);
  assert.match(css, /Plus Jakarta Sans/);
});

test("keeps GitHub Pages routes connected to the branded application", async () => {
  const bridgeFiles = ["index.html", "apps.html", "legal.html", "404.html"];
  const contents = await Promise.all(
    bridgeFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")),
  );

  for (const html of contents) {
    assert.match(html, /https:\/\/ascend-solutions\.skyler-crestani-sc\.chatgpt\.site/);
    assert.match(html, /<iframe/i);
    assert.doesNotMatch(html, /window\.location\.replace|http-equiv="refresh"/i);
    assert.doesNotMatch(html, /vinext-starter/i);
  }
});

test("serves both local fonts with immutable caching for GET and HEAD", async () => {
  for (const name of ["bree-serif-latin-v18-ca092b4130ee.woff2", "plus-jakarta-sans-latin-variable-v12-153fc85b7029.woff2"]) {
    const bytes = await readFile(new URL(`../public/fonts/${name}`, import.meta.url));
    for (const method of ["GET", "HEAD"]) {
      let assetPath;
      const response = await render(`/font-assets/${name}`, { method }, {
        ASSETS: { fetch: async (request) => {
          assetPath = new URL(request.url).pathname;
          return new Response(method === "HEAD" ? null : bytes, { headers: { "cache-control": "public, max-age=0, must-revalidate" } });
        } },
      });
      assert.equal(assetPath, `/fonts/${name}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "font/woff2");
      assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), method === "HEAD" ? Buffer.alloc(0) : bytes);
    }
  }
});


test("embeds original Pantrii artwork without separate icon requests", async () => {
  for (const route of ["/", "/apps"]) {
    const html = await (await render(route)).text();
    const kinds = route === "/" ? ["light"] : ["light", "dark"];
    for (const kind of kinds) {
      const original = await readFile(new URL(`../public/brand/pantrii-${kind}-icon.svg`, import.meta.url));
      assert.ok(html.includes(`src="data:image/svg+xml;base64,${original.toString("base64")}"`));
    }
    assert.doesNotMatch(html, /src="\/brand\/pantrii-(light|dark)-icon\.svg/);
  }
});

test("serves the fingerprinted favicon with browser caching", async () => {
  const bytes = await readFile(new URL("../public/brand/ascend-icon-background.png", import.meta.url));
  let assetPath;
  const response = await render("/brand-assets/ascend-icon-background-0c83e0a36b7a.png", {}, {
    ASSETS: { fetch: async (request) => {
      assetPath = new URL(request.url).pathname;
      return new Response(bytes);
    } },
  });
  assert.equal(assetPath, "/brand/ascend-icon-background.png");
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
});

test("public pages need no external framework scripts or stylesheets", async () => {
  for (const path of ["/", "/apps", "/legal"]) {
    const response = await render(path);
    const html = await response.text();
    assert.equal(response.headers.get("cache-control"), "public, max-age=300, s-maxage=3600");
    assert.doesNotMatch(html, /<script\b[^>]*\bsrc=|rel="(?:stylesheet|modulepreload)"|\/_next\//i);
    assert.match(html, /<style data-ascend-public-styles>/);
    assert.match(html, /<script data-ascend-public-interactions>/);
    const head = await render(path, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  }
});

test("static public pages retain the original main content and compiled styles", async () => {
  for (const path of ["/", "/apps", "/legal"]) {
    const baselines = JSON.parse(await readFile(new URL("./.public-render-baselines.json", import.meta.url), "utf8"));
    const original = baselines[path];
    const optimized = await (await render(path)).text();
    const content = (html) => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1].replace(/<img\b[^>]*>/g, "");
    assert.equal(content(optimized), content(original));
    const cssUrl = original.match(/<link\b(?=[^>]*rel="stylesheet")[^>]*href="([^"]+)"/)[1];
    const css = await readFile(new URL(`../dist/client${cssUrl}`, import.meta.url), "utf8");
    assert.ok(optimized.includes('<style data-ascend-public-styles>' + css + '</style>'));
  }
});

test("private admin pages retain their authenticated runtime", async () => {
  const response = await render("/admin/waitlist");
  assert.notEqual(response.headers.get("cache-control"), "public, max-age=300, s-maxage=3600");
  assert.match(await response.text(), /Email me a sign-in link/);
});

test("handles crawler guidance and irrelevant scanner paths without rendering", async () => {
  let assetCalls = 0;
  const env = { ASSETS: { fetch: async () => { assetCalls++; throw new Error("Unexpected asset request"); } } };
  const robots = await render("/robots.txt", {}, env);
  assert.equal(robots.status, 200);
  assert.equal(robots.headers.get("cache-control"), "public, max-age=86400");
  const text = await robots.text();
  assert.match(text, /Allow: \/\n/);
  assert.match(text, /Disallow: \/admin\//);
  for (const path of ["/xmlrpc.php", "/wp-login.php", "/wp-admin/install.php"]) {
    const response = await render(path, {}, env);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), "Not found");
  }
  assert.equal(assetCalls, 0);
});


test("public HTML is bundled and needs no runtime asset lookup", async () => {
  for (const path of ["/", "/apps", "/legal"]) {
    const response = await render(path, {}, { ASSETS: { fetch: async () => { throw new Error("Public HTML must not fetch another asset"); } } });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /data-ascend-public-styles/);
  }
});
