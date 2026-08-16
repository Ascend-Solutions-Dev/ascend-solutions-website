import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the branded Ascend homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Ascend Solutions \| Technology Built for Families/);
  assert.match(html, /Practical apps for busy/);
  assert.match(html, /Family-first design/);
  assert.match(html, /\/brand\/ascend-long-light\.png/);
  assert.match(html, /\/og\.png/);
});

test("renders the apps and legal routes", async () => {
  const [apps, legal] = await Promise.all([render("/apps"), render("/legal")]);
  assert.equal(apps.status, 200);
  assert.equal(legal.status, 200);
  const appsHtml = await apps.text();
  assert.match(appsHtml, /Tools built for real family life/);
  assert.match(appsHtml, /Kinlii/);
  assert.match(appsHtml, /pantrii-dark-icon\.svg/);
  assert.match(await legal.text(), /Privacy Policy/);
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
