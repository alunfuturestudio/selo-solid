import { describe, expect, it } from 'vitest';
import { srpMaxImportsPerFile } from '../src/rules/srpMaxImportsPerFile.js';
import { fixtureFile } from './helpers.js';

function importsFrom(n: number): string {
  const lines: string[] = [];
  for (let i = 0; i < n; i += 1) lines.push(`import x${i} from 'mod-${i}';`);
  return lines.join('\n') + '\n';
}

describe('srp/max-imports-per-file', () => {
  it('counts under-goal files', () => {
    const file = fixtureFile(importsFrom(5));
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(5);
  });

  it('counts at-goal files', () => {
    const file = fixtureFile(importsFrom(15));
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(15);
  });

  it('counts over-goal files', () => {
    const file = fixtureFile(importsFrom(20));
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(20);
  });

  it('counts type-only imports', () => {
    const file = fixtureFile(
      "import type { T } from 'a';\nimport { y } from 'b';\n",
    );
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
  });

  it('counts dynamic imports at top level', () => {
    const file = fixtureFile("const x = import('foo');\nimport('bar');\n");
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
  });

  it('does not count dynamic imports inside function bodies', () => {
    const file = fixtureFile(
      "import { a } from 'top';\n" +
        "function lazy() { return import('inside'); }\n" +
        "const arrow = () => import('arrow-inside');\n",
    );
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });

  it('counts require() calls at module scope', () => {
    const file = fixtureFile("const r = require('bar');\nrequire('side-effect');\n");
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
  });

  it('does not count require() calls inside function bodies', () => {
    const file = fixtureFile(
      "function load() { return require('inside'); }\n",
    );
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(0);
  });

  it('counts multiple named bindings from one source as one', () => {
    const file = fixtureFile("import { a, b, c, d, e } from 'mod';\n");
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });

  it('counts TSImportEqualsDeclaration', () => {
    const file = fixtureFile("import A = require('legacy');\n");
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });

  it('reports zero for an empty file', () => {
    const file = fixtureFile('');
    const ms = srpMaxImportsPerFile.measure(file, undefined);
    expect(ms[0]?.value).toBe(0);
  });
});
