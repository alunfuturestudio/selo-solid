import { describe, expect, it } from 'vitest';
import { ispMaxInterfaceMembers } from '../src/rules/ispMaxInterfaceMembers.js';
import { fixtureFile } from './helpers.js';

describe('isp/max-interface-members', () => {
  it('counts TSPropertySignature and TSMethodSignature', () => {
    const file = fixtureFile(
      'interface A {\n  foo: number;\n  bar(): void;\n  baz: string;\n}\n',
    );
    const ms = ispMaxInterfaceMembers.measure(file, undefined);
    expect(ms).toHaveLength(1);
    expect(ms[0]?.value).toBe(3);
    expect(ms[0]?.name).toBe("'A'");
  });

  it('handles TSTypeLiteral too', () => {
    const file = fixtureFile('type X = { a: number; b: string; c(): void };\n');
    const ms = ispMaxInterfaceMembers.measure(file, undefined);
    // Includes the inner literal; the alias itself isn't an interface.
    expect(ms.some((m) => m.value === 3 && m.name === '<type literal>')).toBe(true);
  });

  it('does not count index, construct, or call signatures', () => {
    const file = fixtureFile(
      'interface A {\n' +
        '  [k: string]: unknown;\n' +
        '  new (): A;\n' +
        '  (x: number): string;\n' +
        '  prop: number;\n' +
        '}\n',
    );
    const ms = ispMaxInterfaceMembers.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });

  it('reports each interface declaration separately', () => {
    const file = fixtureFile(
      'interface A { x: number; }\ninterface B { y: string; z: boolean; }\n',
    );
    const ms = ispMaxInterfaceMembers.measure(file, undefined);
    const byName = new Map(ms.map((m) => [m.name, m.value]));
    expect(byName.get("'A'")).toBe(1);
    expect(byName.get("'B'")).toBe(2);
  });

  it('reports zero for an empty interface', () => {
    const file = fixtureFile('interface Empty {}\n');
    const ms = ispMaxInterfaceMembers.measure(file, undefined);
    expect(ms[0]?.value).toBe(0);
  });
});
