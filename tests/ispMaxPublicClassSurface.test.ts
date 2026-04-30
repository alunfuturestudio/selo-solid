import { describe, expect, it } from 'vitest';
import { ispMaxPublicClassSurface } from '../src/rules/ispMaxPublicClassSurface.js';
import { fixtureFile } from './helpers.js';

describe('isp/max-public-class-surface', () => {
  it('counts public methods and public fields together', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  x = 1;\n' +
        '  y = 2;\n' +
        '  foo() {}\n' +
        '  bar() {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(4);
    expect(ms[0]?.name).toBe("'A'");
  });

  it('skips private and protected members', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  private a = 1;\n' +
        '  protected b = 2;\n' +
        '  private foo() {}\n' +
        '  protected bar() {}\n' +
        '  public baz() {}\n' +
        '  qux() {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
  });

  it('skips #private hash-name members', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  #secret = 1;\n' +
        '  #hide() {}\n' +
        '  visible() {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });

  it('does not count the constructor itself', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  constructor() {}\n' +
        '  foo() {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(1);
  });

  it('counts public TS parameter properties as public fields', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  constructor(\n' +
        '    public readonly id: string,\n' +
        '    public name: string,\n' +
        '    private secret: string,\n' +
        '    plain: number,\n' +
        '  ) {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
  });

  it('collapses a getter/setter pair into a single member', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  get x() { return 1; }\n' +
        '  set x(v: number) {}\n' +
        '  foo() {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
  });

  it('counts a lone getter as one member', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  get x() { return 1; }\n' +
        '  foo() {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
  });

  it('includes static members in the public surface', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  static VERSION = 1;\n' +
        '  static of() {}\n' +
        '  foo() {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(3);
  });

  it('reports the boundary value at the threshold', () => {
    const file = fixtureFile(
      'class A {\n' +
        '  m1() {} m2() {} m3() {} m4() {} m5() {}\n' +
        '  m6() {} m7() {} m8() {} m9() {} m10() {}\n' +
        '}\n',
    );
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(10);
  });

  it('reports a class expression as <anonymous class>', () => {
    const file = fixtureFile('const X = class { a() {} b() {} };');
    const ms = ispMaxPublicClassSurface.measure(file, undefined);
    expect(ms[0]?.value).toBe(2);
    expect(ms[0]?.name).toBe('<anonymous class>');
  });
});
