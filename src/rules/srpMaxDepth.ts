import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { type FnLikeNode, functionName, isFunctionType, walkAst } from '../lib/walk.js';

const DEPTH_TYPES = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'TryStatement',
]);

function maxDepthInBody(body: unknown): number {
  let max = 0;
  function recurse(node: unknown, depth: number): void {
    if (Array.isArray(node)) {
      for (const c of node) recurse(c, depth);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string };
    // Stop descent at nested functions — they have their own depth.
    if (typeof n.type === 'string' && isFunctionType(n.type)) return;
    let nextDepth = depth;
    if (typeof n.type === 'string' && DEPTH_TYPES.has(n.type)) {
      nextDepth = depth + 1;
      if (nextDepth > max) max = nextDepth;
    }
    const obj = node as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      if (k === 'parent' || k === 'loc' || k === 'range') continue;
      recurse(obj[k], nextDepth);
    }
  }
  recurse(body, 0);
  return max;
}

export const srpMaxDepth: SeloRule = {
  meta: {
    id: 'srp/max-depth',
    description: 'SRP: cap nesting depth per function.',
    type: 'threshold',
    unitLabel: 'depth/fn',
    seal:
      'Function {{name}} reaches nesting depth {{value}}. ' +
      'Flatten it: extract guard clauses, lift early returns, or replace nested branches with a lookup table.',
  },
  measure(file): SeloMeasurement[] {
    const out: SeloMeasurement[] = [];
    walkAst(file.ast, (node) => {
      const n = node as FnLikeNode;
      if (!isFunctionType(n.type)) return;
      if (!n.loc) return;
      const value = maxDepthInBody(n.body);
      out.push({
        value,
        file: file.path,
        startLine: n.loc.start.line,
        endLine: n.loc.end.line,
        name: functionName(n),
        data: { name: functionName(n), value },
      });
    });
    return out;
  },
};
