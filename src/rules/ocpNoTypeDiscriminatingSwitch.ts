import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { walkAst } from '../lib/walk.js';

interface OcpOptions {
  minBranches?: number;
  discriminators?: string[];
}

const DEFAULTS: Required<OcpOptions> = {
  minBranches: 4,
  discriminators: ['kind', 'type', '__typename', 'tag'],
};

interface MemberRef {
  object: string;
  property: string;
}

function readMemberPath(node: unknown): MemberRef | null {
  const n = node as {
    type?: string;
    computed?: boolean;
    object?: { type?: string; name?: string; object?: unknown; property?: { type?: string; name?: string } };
    property?: { type?: string; name?: string };
  };
  if (n.type !== 'MemberExpression' || n.computed) return null;
  if (n.property?.type !== 'Identifier' || n.property.name === undefined) return null;
  if (n.object?.type === 'Identifier' && n.object.name !== undefined) {
    return { object: n.object.name, property: n.property.name };
  }
  if (n.object?.type === 'ThisExpression') return { object: 'this', property: n.property.name };
  if (n.object?.type === 'MemberExpression') {
    const inner = readMemberPath(n.object);
    if (!inner) return null;
    return { object: `${inner.object}.${inner.property}`, property: n.property.name };
  }
  return null;
}

function isDiscriminator(ref: MemberRef | null, discriminators: string[]): boolean {
  return ref !== null && discriminators.includes(ref.property);
}

function refsEqual(a: MemberRef, b: MemberRef): boolean {
  return a.object === b.object && a.property === b.property;
}

function discriminatorFromTest(test: unknown, discriminators: string[]): MemberRef | null {
  const t = test as { type?: string; operator?: string; left?: unknown; right?: unknown };
  if (t.type !== 'BinaryExpression') return null;
  if (t.operator !== '===' && t.operator !== '==') return null;
  const left = readMemberPath(t.left);
  const right = readMemberPath(t.right);
  const lt = (t.left as { type?: string }).type;
  const rt = (t.right as { type?: string }).type;
  if (isDiscriminator(left, discriminators) && rt === 'Literal') return left;
  if (isDiscriminator(right, discriminators) && lt === 'Literal') return right;
  return null;
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

export const ocpNoTypeDiscriminatingSwitch: SeloRule<OcpOptions> = {
  meta: {
    id: 'ocp/no-type-discriminating-switch',
    description:
      'OCP: flag if/else if/switch chains that dispatch on a single discriminator (kind/type/__typename/tag).',
    type: 'count',
    unitLabel: 'dispatches',
    seal:
      '{{kind}} branches on `{{discriminator}}` with {{count}} cases. ' +
      'Type-discriminating dispatch is OCP-hostile — every new variant forces editing this code instead of adding a new module. ' +
      'Replace with a `Record<{{discriminator}}, Handler>` lookup table or a polymorphic strategy/class hierarchy, so new variants are additive.',
    defaults: DEFAULTS,
  },
  measure(file, options): SeloMeasurement[] {
    const opts = { ...DEFAULTS, ...(options ?? {}) };
    const out: SeloMeasurement[] = [];

    walkAst(file.ast, (node) => {
      const n = node as { type?: string };
      if (n.type === 'SwitchStatement') {
        const sw = node as {
          discriminant?: unknown;
          cases?: Array<{ test: unknown }>;
          loc?: { start: { line: number } };
        };
        const ref = readMemberPath(sw.discriminant);
        if (!isDiscriminator(ref, opts.discriminators) || ref === null) return;
        const branches = sw.cases?.filter((c) => c.test !== null).length ?? 0;
        if (branches < opts.minBranches) return;
        out.push({
          value: 1,
          file: file.path,
          startLine: sw.loc?.start.line,
          data: { kind: 'Switch', discriminator: ref.property, count: branches },
        });
        return;
      }
      if (n.type === 'IfStatement') {
        const ifn = node as {
          parent?: { type?: string; alternate?: unknown };
          loc?: { start: { line: number } };
        };
        // Only check at the chain root.
        if (ifn.parent?.type === 'IfStatement' && ifn.parent.alternate === node) return;
        const tests = collectIfChainTests(node);
        if (tests.length < opts.minBranches) return;
        const refs = tests.map((t) => discriminatorFromTest(t, opts.discriminators));
        if (refs.some((r) => r === null)) return;
        const first = refs[0];
        if (!first) return;
        if (!refs.every((r) => r !== null && refsEqual(r, first))) return;
        out.push({
          value: 1,
          file: file.path,
          startLine: ifn.loc?.start.line,
          data: {
            kind: 'If/else-if chain',
            discriminator: first.property,
            count: tests.length,
          },
        });
      }
    });
    return out;
  },
};
