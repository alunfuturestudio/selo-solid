import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { walkAst } from '../lib/walk.js';

/**
 * ISP: cap members per interface (or anonymous object type literal).
 *
 * Counts only the things a consumer actually has to know: property signatures
 * and method signatures. Index / construct / call signatures are excluded —
 * they're not "members a client uses by name" in the ISP sense.
 *
 * The seal message points the reader at the standard fix: split the fat
 * interface by client. The pattern is well-known but worth restating because
 * it's surprisingly easy to skip — most reviews tolerate "one more property"
 * indefinitely.
 */
interface InterfaceLikeNode {
  type: string;
  id?: { name: string };
  body?: { body?: Array<{ type: string }> };
  members?: Array<{ type: string }>;
  loc?: { start: { line: number }; end: { line: number } };
}

const COUNTED_MEMBERS = new Set(['TSPropertySignature', 'TSMethodSignature']);

export const ispMaxInterfaceMembers: SeloRule = {
  meta: {
    id: 'isp/max-interface-members',
    description: 'ISP: cap the number of members per interface or type literal.',
    type: 'threshold',
    unitLabel: 'members',
    seal:
      'Interface {{name}} has {{value}} members. ' +
      'Fat interfaces force every consumer to depend on methods they do not use. ' +
      "Split by client — e.g. {{name}}Reader for read-only consumers, {{name}}Writer for the few that mutate.",
  },
  measure(file): SeloMeasurement[] {
    const out: SeloMeasurement[] = [];
    walkAst(file.ast, (node) => {
      const n = node as InterfaceLikeNode;
      if (n.type === 'TSInterfaceDeclaration') {
        const items = n.body?.body ?? [];
        const value = items.filter((m) => COUNTED_MEMBERS.has(m.type)).length;
        const name = n.id?.name !== undefined ? `'${n.id.name}'` : '<anonymous>';
        out.push({
          value,
          file: file.path,
          startLine: n.loc?.start.line,
          endLine: n.loc?.end.line,
          name,
          data: { name, value },
        });
        return;
      }
      if (n.type === 'TSTypeLiteral') {
        const items = n.members ?? [];
        const value = items.filter((m) => COUNTED_MEMBERS.has(m.type)).length;
        out.push({
          value,
          file: file.path,
          startLine: n.loc?.start.line,
          endLine: n.loc?.end.line,
          name: '<type literal>',
          data: { name: '<type literal>', value },
        });
      }
    });
    return out;
  },
};
