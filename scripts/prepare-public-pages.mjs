import { writeFile } from 'node:fs/promises';
// First pass renders fresh source pages; second pass bundles the generated HTML.
await writeFile('worker/generated-public-pages.ts', 'export const generatedPublicPages: Record<string, string> = {};\n');
