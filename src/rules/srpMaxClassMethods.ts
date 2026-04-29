import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { walkAst } from '../lib/walk.js';

interface ClassLikeNode {
  type: string;
  id?: { name: string };
  body?: { body?: Array<{ type: string }> };
  loc?: { start: { line: number }; end: { line: number } };
}

export const srpMaxClassMethods: SeloRule = {
  meta: {
    id: 'srp/max-class-methods',
    description: 'SRP: cap the number of methods per class.',
    type: 'threshold',
    unitLabel: 'methods',
    seal:
      'Class {{name}} has {{value}} methods. ' +
      'Too many methods is a sign the class is doing too much — extract a collaborator class for a coherent subset of behaviour, do not just split the file.',
  },
  measure(file): SeloMeasurement[] {
    const out: SeloMeasurement[] = [];
    walkAst(file.ast, (node) => {
      const n = node as ClassLikeNode;
      if (n.type !== 'ClassDeclaration' && n.type !== 'ClassExpression') return;
      const items = n.body?.body ?? [];
      const value = items.filter((m) => m.type === 'MethodDefinition').length;
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
