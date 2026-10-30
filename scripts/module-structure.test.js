import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const walk = folder => readdirSync(folder, {withFileTypes:true}).flatMap(entry =>
  entry.isDirectory() ? walk(join(folder, entry.name)) : [join(folder, entry.name)]);
const graph = new Map(walk(join(root, 'js')).filter(path => path.endsWith('.js')).map(path => {
  const imports = [...readFileSync(path, 'utf8').matchAll(/(?:from\s*|import\s*\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)]
    .map(match => resolve(dirname(path), match[1].split('?')[0]));
  return [path, imports];
}));

test('all local module references exist and the dependency graph has no cycles', () => {
  const done = new Set(), visiting = new Set();
  function visit(path) {
    assert(existsSync(path), `Missing module: ${path}`);
    assert(!visiting.has(path), `Circular import: ${path}`);
    if (done.has(path)) return;
    visiting.add(path);
    for (const child of graph.get(path) || []) visit(child);
    visiting.delete(path);
    done.add(path);
  }
  for (const path of graph.keys()) visit(path);
});

test('chart modules do not depend on application controllers', () => {
  for (const [path, imports] of graph) {
    if (!path.includes('/charts/')) continue;
    for (const controller of ['app.js', 'explorer.js']) {
      assert(!imports.includes(join(root, 'js', controller)), `${path} imports ${controller}`);
    }
  }
});
