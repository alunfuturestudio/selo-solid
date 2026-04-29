import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { type FnLikeNode, functionName, isFunctionType, walkAst } from '../lib/walk.js';

export const srpMaxFunctionLines: SeloRule = {
  meta: {
    id: 'srp/max-function-lines',
    description: 'SRP: cap function length.',
    type: 'threshold',
    unitLabel: 'lines/fn',
    seal:
      'Function {{name}} is {{value}} lines. ' +
      'Function-length failure: do a strong refactor — extract helpers, do not just trim a few lines. ' +
      'Leave real headroom.',
  },
  measure(file): SeloMeasurement[] {
    const out: SeloMeasurement[] = [];
    walkAst(file.ast, (node) => {
      const n = node as FnLikeNode;
      if (!isFunctionType(n.type)) return;
      if (!n.loc) return;
      const value = n.loc.end.line - n.loc.start.line + 1;
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
