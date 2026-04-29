import { describe, expect, it } from 'vitest';
import { srpMaxStatementsPerFunction } from '../src/rules/srpMaxStatementsPerFunction.js';
import { fixtureFile } from './helpers.js';

describe('srp/max-statements-per-function', () => {
  it('counts top-level statements in a block body', () => {
    const file = fixtureFile(
      'function f() {\n  const a = 1;\n  const b = 2;\n  const c = 3;\n  return a + b + c;\n}',
    );
    const ms = srpMaxStatementsPerFunction.measure(file, undefined);
    expect(ms[0]?.value).toBe(4);
  });

  it('counts an expression-bodied arrow as 1', () => {
    const file = fixtureFile('const f = (x) => x + 1;');
    const ms = srpMaxStatementsPerFunction.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });
});
