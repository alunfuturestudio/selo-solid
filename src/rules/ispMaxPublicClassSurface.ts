import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { walkAst } from '../lib/walk.js';

/**
 * ISP: cap the *public* surface of a class — methods and fields that a
 * consumer can see by name. Different from `srp/max-class-methods`, which
 * counts every method (private + protected + public) as an internal-complexity
 * signal. A class can be SRP-clean but ISP-fat: a small total method count
 * with most of them public still forces every consumer to depend on more
 * than they need.
 *
 * Counted as one public member each:
 *   - public `MethodDefinition` (no `private`/`protected`, not `#hashName`,
 *     not the constructor)
 *   - public `PropertyDefinition` (same filters)
 *   - `TSParameterProperty` on the constructor that is not `private`/`protected`
 *   - getter/setter pairs collapse to one (clients see a single property)
 *   - static members are included — `Foo.bar` is part of the public surface
 */

interface KeyNode {
  type?: string;
  name?: string;
  value?: string | number;
}

interface ClassMemberNode {
  type: string;
  kind?: string;
  static?: boolean;
  accessibility?: 'public' | 'private' | 'protected';
  key?: KeyNode;
  value?: { params?: ClassMemberNode[] };
}

interface ClassNode {
  type: string;
  id?: { name: string };
  body?: { body?: ClassMemberNode[] };
  loc?: { start: { line: number }; end: { line: number } };
}

function isPrivateOrProtected(m: ClassMemberNode): boolean {
  return m.accessibility === 'private' || m.accessibility === 'protected';
}

function accessorKey(m: ClassMemberNode): string | undefined {
  const k = m.key;
  if (!k) return undefined;
  const scope = m.static === true ? 'S' : 'I';
  if (k.type === 'Identifier' && k.name !== undefined) return `${scope}:id:${k.name}`;
  if (k.type === 'Literal' && k.value !== undefined) return `${scope}:lit:${String(k.value)}`;
  return undefined;
}

export const ispMaxPublicClassSurface: SeloRule = {
  meta: {
    id: 'isp/max-public-class-surface',
    description: 'ISP: cap the public surface (methods + fields) per class.',
    type: 'threshold',
    unitLabel: 'members',
    seal:
      'Class {{name}} exposes {{value}} public members. ' +
      'A wide public surface forces every consumer to depend on more than they need. ' +
      'Split by client — e.g. {{name}}Reader for read-only consumers, {{name}}Writer for the few that mutate.',
  },
  measure(file): SeloMeasurement[] {
    const out: SeloMeasurement[] = [];
    walkAst(file.ast, (node) => {
      const n = node as ClassNode;
      if (n.type !== 'ClassDeclaration' && n.type !== 'ClassExpression') return;
      const items = n.body?.body ?? [];
      let value = 0;
      const seenAccessorKeys = new Set<string>();

      for (const m of items) {
        if (m.type === 'MethodDefinition') {
          if (m.kind === 'constructor') {
            const params = m.value?.params ?? [];
            for (const p of params) {
              if (p.type !== 'TSParameterProperty') continue;
              if (isPrivateOrProtected(p)) continue;
              value++;
            }
            continue;
          }
          if (isPrivateOrProtected(m)) continue;
          if (m.key?.type === 'PrivateIdentifier') continue;
          if (m.kind === 'get' || m.kind === 'set') {
            const key = accessorKey(m);
            if (key !== undefined) {
              if (seenAccessorKeys.has(key)) continue;
              seenAccessorKeys.add(key);
            }
          }
          value++;
          continue;
        }
        if (m.type === 'PropertyDefinition') {
          if (isPrivateOrProtected(m)) continue;
          if (m.key?.type === 'PrivateIdentifier') continue;
          value++;
        }
      }

      const name = n.id?.name !== undefined ? `'${n.id.name}'` : '<anonymous class>';
      out.push({
        value,
        file: file.path,
        startLine: n.loc?.start.line,
        endLine: n.loc?.end.line,
        name,
        data: { name, value },
      });
    });
    return out;
  },
};
