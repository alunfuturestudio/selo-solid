import { describe, expect, it } from 'vitest';
import { srpMaxFileLines } from '../src/rules/srpMaxFileLines.js';
import { fixtureFile } from './helpers.js';

describe('srp/max-file-lines', () => {
  it('emits one measurement per file with the source line count', () => {
    const file = fixtureFile('const a = 1;\nconst b = 2;\nconst c = 3;\n', 'foo.ts');
    const ms = srpMaxFileLines.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.value).toBe(4); // trailing newline produces an empty 4th element
    expect(ms[0]?.file).toBe('foo.ts');
  });

  it('handles an empty file as 0 lines', () => {
    const file = fixtureFile('', 'empty.ts');
    const ms = srpMaxFileLines.measure(file, undefined);
    expect(ms[0]?.value).toBe(0);
  });
});
