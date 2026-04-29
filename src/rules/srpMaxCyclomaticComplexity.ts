import type { SeloMeasurement, SeloRule } from '@guilhermesilveira/selo';
import { type FnLikeNode, functionName, isFunctionType, walkAst, walkAstSkip } from '../lib/walk.js';

const LOGICAL_ASSIGN = new Set(['||=', '&&=', '??=']);

function isComplexityContributor(node: unknown): boolean {
  const n = node as { type?: string; test?: unknown; operator?: string; optional?: boolean };
  switch (n.type) {
    case 'CatchClause':
    case 'ConditionalExpression':
    case 'LogicalExpression':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'IfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'AssignmentPattern':
      return true;
    case 'SwitchCase':
      return n.test != null;
    case 'AssignmentExpression':
      return typeof n.operator === 'string' && LOGICAL_ASSIGN.has(n.operator);
    case 'MemberExpression':
    case 'CallExpression':
      return n.optional === true;
    default:
      return false;
  }
}

function computeComplexity(fnBody: unknown): number {
  let c = 1;
  walkAstSkip(
    fnBody,
    (n) => {
      if (isComplexityContributor(n)) c++;
    },
    (n) => {
      const t = (n as { type?: string }).type;
      return typeof t === 'string' && isFunctionType(t);
    },
  );
  return c;
}

export const srpMaxCyclomaticComplexity: SeloRule = {
  meta: {
    id: 'srp/max-cyclomatic-complexity',
    description: 'SRP: cap cyclomatic complexity per function.',
    type: 'threshold',
    unitLabel: 'CC/fn',
    seal:
      'Function {{name}} has cyclomatic complexity {{value}}. ' +
      'Reduce branching: extract decision logic into pure helpers, ' +
      'replace `if/else if` chains over a discriminator with a lookup table or polymorphism.',
  },
  measure(file): SeloMeasurement[] {
    const out: SeloMeasurement[] = [];
    walkAst(file.ast, (node) => {
      const n = node as FnLikeNode;
      if (!isFunctionType(n.type)) return;
      if (!n.loc) return;
      const value = computeComplexity(n.body);
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
