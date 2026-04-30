import { describe, expect, it } from 'vitest';
import { ocpNoInstanceofChain } from '../src/rules/ocpNoInstanceofChain.js';
import { fixtureFile } from './helpers.js';

describe('ocp/no-instanceof-chain', () => {
  it('flags a 3-branch if/else-if chain on a single discriminator', () => {
    const file = fixtureFile(
      'if (x instanceof A) {} else if (x instanceof B) {} else if (x instanceof C) {}',
    );
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.value).toBe(1);
    expect(ms[0]?.data?.kind).toBe('If/else-if chain');
    expect(ms[0]?.data?.discriminator).toBe('x');
    expect(ms[0]?.data?.count).toBe(3);
  });

  it('flags a 2-branch if/else-if chain (default minBranches)', () => {
    const file = fixtureFile('if (x instanceof A) {} else if (x instanceof B) {}');
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.data?.count).toBe(2);
  });

  it('does not flag a single-branch instanceof guard', () => {
    const file = fixtureFile('if (x instanceof A) { doSomething(); }');
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(0);
  });

  it('does not flag a chain on different discriminators', () => {
    const file = fixtureFile(
      'if (x instanceof A) {} else if (y instanceof B) {} else if (z instanceof C) {}',
    );
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(0);
  });

  it('does not flag a chain that mixes instanceof and unrelated tests', () => {
    const file = fixtureFile(
      'if (x instanceof A) {} else if (other) {} else if (x instanceof B) {}',
    );
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(0);
  });

  it('flags a ternary chain on a single discriminator', () => {
    const file = fixtureFile(
      'const r = x instanceof A ? 1 : x instanceof B ? 2 : x instanceof C ? 3 : 0;',
    );
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.data?.kind).toBe('Ternary chain');
    expect(ms[0]?.data?.discriminator).toBe('x');
    expect(ms[0]?.data?.count).toBe(3);
  });

  it('does not flag a single ternary instanceof', () => {
    const file = fixtureFile('const r = x instanceof A ? 1 : 0;');
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(0);
  });

  it('compares discriminators structurally for member access paths', () => {
    const file = fixtureFile(
      'if (this.node instanceof A) {} else if (this.node instanceof B) {}',
    );
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.data?.discriminator).toBe('this.node');
  });

  it('respects custom minBranches', () => {
    const file = fixtureFile('if (x instanceof A) {} else if (x instanceof B) {}');
    const off = ocpNoInstanceofChain.measure(file, { minBranches: 3 });
    expect(off).toHaveLength(0);
    const on = ocpNoInstanceofChain.measure(file, { minBranches: 2 });
    expect(on).toHaveLength(1);
  });

  it('does not double-fire on nested if chains', () => {
    const file = fixtureFile(
      'if (x instanceof A) {} else if (x instanceof B) { if (y instanceof C) {} else if (y instanceof D) {} }',
    );
    const ms = ocpNoInstanceofChain.measure(file, undefined);
    expect(ms).toHaveLength(2);
    const discriminators = ms.map((m) => m.data?.discriminator).sort();
    expect(discriminators).toEqual(['x', 'y']);
  });
});
