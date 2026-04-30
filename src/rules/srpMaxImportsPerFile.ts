import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { isFunctionType, walkAstSkip } from '../lib/walk.js';

interface NodeWithType {
  type: string;
  callee?: { type?: string; name?: string };
}

export const srpMaxImportsPerFile: SeloRule = {
  meta: {
    id: 'srp/max-imports-per-file',
    description:
      'SRP: cap the number of import sources per file. High import count is a proxy for the file gluing too many collaborators.',
    type: 'threshold',
    unitLabel: 'imports',
    seal:
      'This file pulls from {{value}} sources. ' +
      'Extract a facade module that re-exports a coherent subset, or split this file by domain — not "import less".',
  },
  measure(file): SeloMeasurement[] {
    let value = 0;
    walkAstSkip(
      file.ast,
      (node) => {
        const n = node as NodeWithType;
        if (n.type === 'ImportDeclaration' || n.type === 'TSImportEqualsDeclaration') {
          value += 1;
          return;
        }
        if (n.type === 'ImportExpression') {
          value += 1;
          return;
        }
        if (n.type === 'CallExpression') {
          const callee = n.callee;
          if (callee?.type === 'Import') {
            value += 1;
            return;
          }
          if (callee?.type === 'Identifier' && callee.name === 'require') {
            value += 1;
          }
        }
      },
      (n) => isFunctionType((n as NodeWithType).type),
    );
    return [
      {
        value,
        file: file.path,
        startLine: 1,
        data: { value },
      },
    ];
  },
};
