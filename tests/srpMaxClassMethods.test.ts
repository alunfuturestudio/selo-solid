import { describe, expect, it } from 'vitest';
import { srpMaxClassMethods } from '../src/rules/srpMaxClassMethods.js';
import { fixtureFile } from './helpers.js';

describe('srp/max-class-methods', () => {
  it('counts MethodDefinition entries', () => {
    const file = fixtureFile('class A { foo() {} bar() {} baz() {} }');
    const ms = srpMaxClassMethods.measure(file, undefined);
    expect(ms[0]?.value).toBe(3);
    expect(ms[0]?.name).toBe("'A'");
  });

  it('does not count property fields', () => {
    const file = fixtureFile('class A { x = 1; y = 2; foo() {} }');
    const ms = srpMaxClassMethods.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });

  it('handles class expressions', () => {
    const file = fixtureFile('const X = class { a() {} b() {} };');
    const ms = srpMaxClassMethods.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
    expect(ms[0]?.name).toBe('<anonymous class>');
  });
});
