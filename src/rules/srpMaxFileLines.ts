import type { SeloRule } from '@guilhermesilveira/selo';

export const srpMaxFileLines: SeloRule = {
  meta: {
    id: 'srp/max-file-lines',
    description: 'SRP: cap file length. Forces decomposition of monolithic files.',
    type: 'threshold',
    unitLabel: 'lines',
    seal:
      'This file has {{value}} lines. ' +
      'Do a strong refactor, not a minimal trim. ' +
      'Leave real headroom so the file does not hit the limit again soon.',
  },
  measure(file) {
    const value = file.source.length === 0 ? 0 : file.source.split('\n').length;
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
