import { expect, it } from 'vitest';
import { walkAst } from '../src/lib/walk.js';
it('visits structural nodes without materializing lexical metadata', () => {
  const identifier = { type: 'Identifier', name: 'x' };
  const ast = {
    type: 'Program', body: [identifier],
    get tokens(): never { throw new Error('tokens must remain lazy'); },
    get comments(): never { throw new Error('comments are not structural nodes'); },
  };
  const visited: unknown[] = [];
  walkAst(ast, (node) => visited.push(node));
  expect(visited).toEqual([ast, identifier]);
});
