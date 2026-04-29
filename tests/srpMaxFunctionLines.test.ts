import { describe, expect, it } from 'vitest';
import { srpMaxFunctionLines } from '../src/rules/srpMaxFunctionLines.js';
import { fixtureFile } from './helpers.js';

describe('srp/max-function-lines', () => {
  it('measures function lines including the brace', () => {
    const file = fixtureFile(
      'function foo() {\n  const a = 1;\n  const b = 2;\n  return a + b;\n}\n',
    );
    const ms = srpMaxFunctionLines.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.value).toBe(5);
    expect(ms[0]?.name).toBe("'foo'");
  });

  it('reports each nested function separately', () => {
    const file = fixtureFile(
      'function outer() {\n  function inner() {\n    return 1;\n  }\n  return inner();\n}',
    );
    const ms = srpMaxFunctionLines.measure(file, undefined);
    expect(ms.length).toBe(2);
    const names = ms.map((m) => m.name).sort();
    expect(names).toEqual(["'inner'", "'outer'"]);
  });

  it('names arrow functions assigned to a variable', () => {
    const file = fixtureFile('const handler = (x) => {\n  return x + 1;\n};');
    const ms = srpMaxFunctionLines.measure(file, undefined);
    expect(ms[0]?.name).toBe("'handler'");
  });
});
