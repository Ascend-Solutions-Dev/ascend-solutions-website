import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import worker from '../dist/server/index.js';

const pages = {};
const baselines = {};
const interactions = await readFile('scripts/public-interactions.js', 'utf8');
const publicRoutes = [['/', 'home'], ['/apps', 'apps'], ['/legal', 'legal']];
const publicImages = new Map();
for (const name of ['ascend-long-light.png', 'ascend-long-dark.png', 'ascend-icon.png']) {
  const original = '/brand/' + name;
  const bytes = await readFile(resolve('public', original.slice(1)));
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  publicImages.set(original, '/public-assets/' + hash + original);
}
const measurements = [];
for (const [route, name] of publicRoutes) {
  // A missing static asset intentionally falls back to the original renderer.
  const response = await worker.fetch(new Request('https://ascendsolutions.dev' + route, { headers: { accept: 'text/html' } }), {
    ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  if (!response.ok) throw new Error('Could not render public page: ' + route);
  let html = await response.text();
  baselines[route] = html;
  const before = (html.match(/<script\b[^>]*\bsrc=/g) || []).length;
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const stylesheets = [...html.matchAll(/<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*\/?\s*>/gi)];
  if (!stylesheets.length) throw new Error('Page has no compiled stylesheet: ' + route);
  for (const match of stylesheets) {
    const url = new URL(match[1], 'https://ascendsolutions.dev');
    const relative = url.pathname.slice(1);
    if (!relative.startsWith('_next/static/') || relative.includes('..')) throw new Error('Unexpected stylesheet URL');
    const css = await readFile(resolve('dist/client', relative), 'utf8');
    if (/<\/style/i.test(css)) throw new Error('Unexpected CSS closing tag');
    html = html.replace(match[0], '<style data-ascend-public-styles>' + css + '</style>');
  }
  // Browsers no longer need framework modules or speculative image preloads.
  html = html.replace(/<link\b(?=[^>]*\brel="(?:modulepreload|preload)")[^>]*\/?\s*>/gi, '');
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const match = tag.match(/\bsrc="([^"]+)"/);
    if (!match || !match[1].startsWith('/_next/image?')) return tag;
    const original = new URL(match[1].replaceAll('&amp;', '&'), 'https://ascendsolutions.dev').searchParams.get('url');
    if (!original || !/^\/brand\/[a-z0-9-]+\.png$/.test(original)) throw new Error('Unexpected public image URL');
    const cached = publicImages.get(original);
    if (!cached) throw new Error('Unregistered public image: ' + original);
    return tag.replace(match[0], 'src="' + cached + '"').replace(/\s+srcSet="[^"]*"/gi, '').replace(/\s+data-nimg="[^"]*"/gi, '');
  });
  const script = route === '/apps' ? interactions : interactions.slice(0, interactions.indexOf('  const form =')) + '})();\n';
  const noScript = '<noscript><style>@media(max-width:850px){.menu-toggle{display:none}.nav-shell{height:auto;min-height:86px;flex-wrap:wrap;padding-top:16px;padding-bottom:16px}.nav-links{display:flex;position:static;flex-wrap:wrap;width:100%;border:0;box-shadow:none}}</style>' + (route === '/apps' ? '<p class="section-shell">Enable JavaScript to join the waitlist, or email <a href="mailto:info@ascendsolutions.dev">info@ascendsolutions.dev</a>.</p>' : '') + '</noscript>';
  html = html.replace('</body>', noScript + '<script data-ascend-public-interactions>' + script + '</script></body>');
  if (/<script\b[^>]*\bsrc=/i.test(html) || /rel="modulepreload"/i.test(html) || /\/_next\//.test(html)) throw new Error('Framework network dependency remains: ' + route);
  pages[name] = html;
  measurements.push({ route, externalScriptsBefore: before, externalScriptsAfter: 0, externalStylesheetsAfter: 0, inlineScriptBytes: Buffer.byteLength(script), htmlBytes: Buffer.byteLength(html) });
}
await writeFile('worker/generated-public-pages.ts', 'export const generatedPublicPages: Record<string, string> = ' + JSON.stringify(pages) + ';\n');
await writeFile('tests/.public-render-baselines.json', JSON.stringify(baselines));
console.log(JSON.stringify(measurements, null, 2));
