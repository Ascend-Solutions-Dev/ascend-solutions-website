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
  assert.match(html, /\/brand\/pantrii-light-icon\.svg/);
  assert.match(html, /\/og\.png/);
  assert.match(html, /Skip to main content/);
  assert.match(html, /Open navigation menu/);
  assert.match(html, /rel="canonical" href="https:\/\/ascendsolutions\.dev\/?"/);
});

test("renders the apps and legal routes", async () => {
  const [apps, legal] = await Promise.all([render("/apps"), render("/legal")]);
  assert.equal(apps.status, 200);
  assert.equal(legal.status, 200);
  const appsHtml = await apps.text();
  assert.match(appsHtml, /Tools built for real family life/);
  assert.match(appsHtml, /Kinlii/);
  assert.match(appsHtml, /pantrii-dark-icon\.svg/);
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
  assert.ok([302, 303, 307, 308].includes(pageResponse.status));
  assert.match(pageResponse.headers.get("location") ?? "", /^\/signin-with-chatgpt\?return_to=/);
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

test("does not ship legacy static entry pages", async () => {
  await Promise.all([
    assert.rejects(access(new URL("../index.html", import.meta.url))),
    assert.rejects(access(new URL("../apps.html", import.meta.url))),
    assert.rejects(access(new URL("../legal.html", import.meta.url))),
  ]);
});
