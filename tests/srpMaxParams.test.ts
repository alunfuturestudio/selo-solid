import { describe, expect, it } from 'vitest';
import { srpMaxParams } from '../src/rules/srpMaxParams.js';
import { fixtureFile } from './helpers.js';

describe('srp/max-params', () => {
  it('counts parameters per function', () => {
    const file = fixtureFile(
      'function a() {}\nfunction b(x, y, z) {}\nconst c = (a, b, c, d, e) => 1;',
    );
    const ms = srpMaxParams.measure(file, undefined);
    const byName = new Map(ms.map((m) => [m.name, m.value]));
    expect(byName.get("'a'")).toBe(0);
    expect(byName.get("'b'")).toBe(3);
    expect(byName.get("'c'")).toBe(5);
  });
});
