import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { type FnLikeNode, functionName, isFunctionType, walkAst } from '../lib/walk.js';

export const srpMaxParams: SeloRule = {
  meta: {
    id: 'srp/max-params',
    description: 'SRP: cap parameter count per function.',
    type: 'threshold',
    unitLabel: 'params/fn',
    seal:
      'Function {{name}} has {{value}} parameters. ' +
      'Wrapping into a parameter object is NOT always the right answer — it is often a fake fix. ' +
      'Before reaching for one, check whether this function should be extracted into a class or a smaller collaborator.',
  },
  measure(file): SeloMeasurement[] {
    const out: SeloMeasurement[] = [];
    walkAst(file.ast, (node) => {
      const n = node as FnLikeNode;
      if (!isFunctionType(n.type)) return;
      if (!n.loc) return;
      const value = n.params?.length ?? 0;
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
