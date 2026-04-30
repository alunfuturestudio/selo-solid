import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { walkAst } from '../lib/walk.js';

interface OcpInstanceofOptions {
  minBranches?: number;
}

const DEFAULTS: Required<OcpInstanceofOptions> = {
  minBranches: 2,
};

function exprKey(node: unknown): string | null {
  const n = node as {
    type?: string;
    name?: string;
    computed?: boolean;
    object?: unknown;
    property?: { type?: string; name?: string };
  };
  if (n.type === 'Identifier' && typeof n.name === 'string') return n.name;
  if (n.type === 'ThisExpression') return 'this';
  if (
    n.type === 'MemberExpression' &&
    !n.computed &&
    n.property?.type === 'Identifier' &&
    typeof n.property.name === 'string'
  ) {
    const objKey = exprKey(n.object);
    if (objKey === null) return null;
    return `${objKey}.${n.property.name}`;
  }
  return null;
}

function instanceofDiscriminator(test: unknown): string | null {
  const t = test as { type?: string; operator?: string; left?: unknown };
  if (t.type !== 'BinaryExpression' || t.operator !== 'instanceof') return null;
  return exprKey(t.left);
}

function collectIfChainTests(node: unknown): unknown[] {
  const tests: unknown[] = [(node as { test: unknown }).test];
  let cur = (node as { alternate?: unknown }).alternate;
  while (cur && (cur as { type?: string }).type === 'IfStatement') {
    tests.push((cur as { test: unknown }).test);
    cur = (cur as { alternate?: unknown }).alternate;
  }
  return tests;
}

function collectTernaryChainTests(node: unknown): unknown[] {
  const tests: unknown[] = [(node as { test: unknown }).test];
  let cur = (node as { alternate?: unknown }).alternate;
  while (cur && (cur as { type?: string }).type === 'ConditionalExpression') {
    tests.push((cur as { test: unknown }).test);
    cur = (cur as { alternate?: unknown }).alternate;
  }
  return tests;
}

function chainKey(tests: unknown[]): string | null {
  const keys = tests.map(instanceofDiscriminator);
  if (keys.some((k) => k === null)) return null;
  const first = keys[0];
  if (first === null || first === undefined) return null;
  return keys.every((k) => k === first) ? first : null;
}

export const ocpNoInstanceofChain: SeloRule<OcpInstanceofOptions> = {
  meta: {
    id: 'ocp/no-instanceof-chain',
    description:
      'OCP: flag if/else-if (or ternary) chains that dispatch on `instanceof` checks against the same discriminator.',
    type: 'count',
    unitLabel: 'dispatches',
    seal:
      '{{kind}} branches on `{{discriminator}} instanceof …` with {{count}} cases. ' +
      'Type-discriminating `instanceof` dispatch is OCP-hostile — every new subtype forces editing this code instead of adding a new module. ' +
      'Replace with polymorphism on the type hierarchy (a method on the base class), or a visitor / handler registry, so new variants are additive.',
    defaults: DEFAULTS,
  },
  measure(file, options): SeloMeasurement[] {
    const opts = { ...DEFAULTS, ...(options ?? {}) };
    const out: SeloMeasurement[] = [];

    walkAst(file.ast, (node) => {
      const n = node as { type?: string };
      if (n.type === 'IfStatement') {
        const ifn = node as {
          parent?: { type?: string; alternate?: unknown };
          loc?: { start: { line: number } };
        };
        // Only check at the chain root.
        if (ifn.parent?.type === 'IfStatement' && ifn.parent.alternate === node) return;
        const tests = collectIfChainTests(node);
        if (tests.length < opts.minBranches) return;
        const key = chainKey(tests);
        if (key === null) return;
        out.push({
          value: 1,
          file: file.path,
          startLine: ifn.loc?.start.line,
          data: {
            kind: 'If/else-if chain',
            discriminator: key,
            count: tests.length,
          },
        });
        return;
      }
      if (n.type === 'ConditionalExpression') {
        const cn = node as {
          parent?: { type?: string; alternate?: unknown };
          loc?: { start: { line: number } };
        };
        // Only check at the chain root.
        if (cn.parent?.type === 'ConditionalExpression' && cn.parent.alternate === node) return;
        const tests = collectTernaryChainTests(node);
        if (tests.length < opts.minBranches) return;
        const key = chainKey(tests);
        if (key === null) return;
        out.push({
          value: 1,
          file: file.path,
          startLine: cn.loc?.start.line,
          data: {
            kind: 'Ternary chain',
            discriminator: key,
            count: tests.length,
          },
        });
      }
    });
    return out;
  },
};
