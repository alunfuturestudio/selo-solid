import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { type FnLikeNode, functionName, isFunctionType, walkAst } from '../lib/walk.js';

export const srpMaxStatementsPerFunction: SeloRule = {
  meta: {
    id: 'srp/max-statements-per-function',
    description: 'SRP: cap statement count per function.',
    type: 'threshold',
    unitLabel: 'stmts/fn',
    seal:
      'Function {{name}} has {{value}} statements. ' +
      'Statement-count failure: do a strong refactor — extract methods or pure helpers, do not just trim. ' +
      'Leave real headroom.',
  },
  measure(file): SeloMeasurement[] {
    const out: SeloMeasurement[] = [];
    walkAst(file.ast, (node) => {
      const n = node as FnLikeNode & { body?: { type?: string; body?: unknown[] } };
      if (!isFunctionType(n.type)) return;
      if (!n.loc) return;
      const body = n.body;
      const value =
        body && body.type === 'BlockStatement' && Array.isArray(body.body) ? body.body.length : 1;
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
