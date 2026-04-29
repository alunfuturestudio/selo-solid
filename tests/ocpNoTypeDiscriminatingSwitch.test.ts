import { describe, expect, it } from 'vitest';
import { ocpNoTypeDiscriminatingSwitch } from '../src/rules/ocpNoTypeDiscriminatingSwitch.js';
import { fixtureFile } from './helpers.js';

describe('ocp/no-type-discriminating-switch', () => {
  it('flags a 4-case switch on .kind', () => {
    const file = fixtureFile(
      'switch (e.kind) {\n  case "a": break;\n  case "b": break;\n  case "c": break;\n  case "d": break;\n}',
    );
    const ms = ocpNoTypeDiscriminatingSwitch.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.value).toBe(1);
    expect(ms[0]?.data?.discriminator).toBe('kind');
    expect(ms[0]?.data?.count).toBe(4);
  });

  it('does not flag a 3-case switch (under default minBranches)', () => {
    const file = fixtureFile(
      'switch (e.kind) { case "a": break; case "b": break; case "c": break; }',
    );
    const ms = ocpNoTypeDiscriminatingSwitch.measure(file, undefined);
    expect(ms).toHaveLength(0);
  });

  it('does not flag a switch on a non-discriminator', () => {
    const file = fixtureFile(
      'switch (n.length) { case 1: break; case 2: break; case 3: break; case 4: break; }',
    );
    const ms = ocpNoTypeDiscriminatingSwitch.measure(file, undefined);
    expect(ms).toHaveLength(0);
  });

  it('flags a 4-branch if/else-if chain on a single discriminator', () => {
    const file = fixtureFile(
      'if (e.kind === "a") {} else if (e.kind === "b") {} else if (e.kind === "c") {} else if (e.kind === "d") {}',
    );
    const ms = ocpNoTypeDiscriminatingSwitch.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.data?.kind).toBe('If/else-if chain');
  });

  it('does not flag a chain with mixed discriminators', () => {
    const file = fixtureFile(
      'if (e.kind === "a") {} else if (other) {} else if (e.kind === "b") {} else if (e.kind === "c") {}',
    );
    const ms = ocpNoTypeDiscriminatingSwitch.measure(file, undefined);
    expect(ms).toHaveLength(0);
  });

  it('respects custom minBranches', () => {
    const file = fixtureFile(
      'switch (e.kind) { case "a": break; case "b": break; case "c": break; }',
    );
    const ms = ocpNoTypeDiscriminatingSwitch.measure(file, { minBranches: 3 });
    expect(ms).toHaveLength(1);
  });

  it('respects custom discriminators', () => {
    const file = fixtureFile(
      'switch (e.shape) { case "a": break; case "b": break; case "c": break; case "d": break; }',
    );
    const off = ocpNoTypeDiscriminatingSwitch.measure(file, undefined);
    expect(off).toHaveLength(0);
    const on = ocpNoTypeDiscriminatingSwitch.measure(file, { discriminators: ['shape'] });
    expect(on).toHaveLength(1);
  });
});
