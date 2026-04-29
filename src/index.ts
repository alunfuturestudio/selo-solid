import type { SeloRulePack } from '@guilhermesilveira/selo';
import { ocpNoTypeDiscriminatingSwitch } from './rules/ocpNoTypeDiscriminatingSwitch.js';
import { srpMaxClassMethods } from './rules/srpMaxClassMethods.js';
import { srpMaxCyclomaticComplexity } from './rules/srpMaxCyclomaticComplexity.js';
import { srpMaxDepth } from './rules/srpMaxDepth.js';
import { srpMaxFileLines } from './rules/srpMaxFileLines.js';
import { srpMaxFunctionLines } from './rules/srpMaxFunctionLines.js';
import { srpMaxParams } from './rules/srpMaxParams.js';
import { srpMaxStatementsPerFunction } from './rules/srpMaxStatementsPerFunction.js';

export const seloSolid: SeloRulePack = {
  name: 'selo-solid',
  version: '0.0.1',
  rules: {
    'srp/max-file-lines': srpMaxFileLines,
    'srp/max-function-lines': srpMaxFunctionLines,
    'srp/max-params': srpMaxParams,
    'srp/max-depth': srpMaxDepth,
    'srp/max-statements-per-function': srpMaxStatementsPerFunction,
    'srp/max-cyclomatic-complexity': srpMaxCyclomaticComplexity,
    'srp/max-class-methods': srpMaxClassMethods,
    'ocp/no-type-discriminating-switch': ocpNoTypeDiscriminatingSwitch,
  },
};

export default seloSolid;

// Individual rule exports for users who want à la carte composition.
export {
  ocpNoTypeDiscriminatingSwitch,
  srpMaxClassMethods,
  srpMaxCyclomaticComplexity,
  srpMaxDepth,
  srpMaxFileLines,
  srpMaxFunctionLines,
  srpMaxParams,
  srpMaxStatementsPerFunction,
};
