import { describe, expect, it } from 'vitest';
import { srpMaxCyclomaticComplexity } from '../src/rules/srpMaxCyclomaticComplexity.js';
import { fixtureFile } from './helpers.js';

describe('srp/max-cyclomatic-complexity', () => {
  it('returns 1 for a function with no branching', () => {
    const file = fixtureFile('function f(x) { return x; }');
    const ms = srpMaxCyclomaticComplexity.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });

  it('counts each branching contributor', () => {
    // 1 base + 4 if = 5
    const file = fixtureFile('function f(x) { if (x) {} if (x) {} if (x) {} if (x) {} }');
    const ms = srpMaxCyclomaticComplexity.measure(file, undefined);
    expect(ms[0]?.value).toBe(5);
  });

  it('counts logical expressions (each && or ||)', () => {
    // 1 base + 2 logical = 3
    const file = fixtureFile('function f(a, b, c) { return a && b && c; }');
    const ms = srpMaxCyclomaticComplexity.measure(file, undefined);
    expect(ms[0]?.value).toBe(3);
  });

  it("isolates complexity per function — nested function counts on its own", () => {
    const file = fixtureFile(
      'function outer(x) {\n' +
        '  if (x) {}\n' +
        '  function inner(y) { if (y) {} if (y) {} }\n' +
        '}',
    );
    const ms = srpMaxCyclomaticComplexity.measure(file, undefined);
    const byName = new Map(ms.map((m) => [m.name, m.value]));
    expect(byName.get("'outer'")).toBe(2);
    expect(byName.get("'inner'")).toBe(3);
  });
});
