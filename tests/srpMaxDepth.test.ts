import { describe, expect, it } from 'vitest';
import { srpMaxDepth } from '../src/rules/srpMaxDepth.js';
import { fixtureFile } from './helpers.js';

describe('srp/max-depth', () => {
  it('returns 0 for a flat function', () => {
    const file = fixtureFile('function f() { return 1; }');
    const ms = srpMaxDepth.measure(file, undefined);
    expect(ms[0]?.value).toBe(0);
  });

  it('counts nested control flow', () => {
    const file = fixtureFile('function f(x) { if (x) { for (;;) { while (1) {} } } }');
    const ms = srpMaxDepth.measure(file, undefined);
    expect(ms[0]?.value).toBe(3);
  });

  it("isolates depth per function — nested function's depth is its own", () => {
    const file = fixtureFile(
      'function outer(x) {\n  if (x) {\n    function inner(y) { if (y) {} }\n  }\n}',
    );
    const ms = srpMaxDepth.measure(file, undefined);
    const byName = new Map(ms.map((m) => [m.name, m.value]));
    expect(byName.get("'outer'")).toBe(1);
    expect(byName.get("'inner'")).toBe(1);
  });
});
