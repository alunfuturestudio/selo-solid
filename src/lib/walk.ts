/**
 * Tiny AST walker. Visits structural AST nodes (including arrays), excluding lexical metadata.
 * No type knowledge — rules narrow nodes by inspecting `node.type`.
 */
export function walkAst(node: unknown, visit: (n: unknown) => void): void {
  walkAstSkip(node, visit, () => false);
}

/**
 * Walk variant that skips descent into nodes for which `skipDescent`
 * returns true. The skipped node is *not* visited.
 *
 * Used by rules that count things "inside a function but not inside
 * nested functions" (depth, cyclomatic complexity, statement count).
 */
export function walkAstSkip(
  node: unknown,
  visit: (n: unknown) => void,
  skipDescent: (n: unknown) => boolean,
): void {
  if (Array.isArray(node)) {
    for (const c of node) walkAstSkip(c, visit, skipDescent);
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (skipDescent(node)) return;
  visit(node);
  const obj = node as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    if (k === 'parent' || k === 'loc' || k === 'range' || k === 'tokens' || k === 'comments') continue;
    walkAstSkip(obj[k], visit, skipDescent);
  }
}

export const FN_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

export function isFunctionType(t: unknown): boolean {
  return typeof t === 'string' && FN_TYPES.has(t);
}

export interface FnLikeNode {
  type: string;
  id?: { name: string };
  loc?: { start: { line: number }; end: { line: number } };
  body?: unknown;
  params?: unknown[];
  parent?: { type?: string; key?: { name?: string } };
}

/**
 * Best-effort name for a function node. For declarations and named
 * function expressions, uses `id.name`. For arrow / unnamed function
 * expressions, looks at the parent (variable declarator, property,
 * method definition) for a name. Falls back to '<anonymous>'.
 */
export function functionName(node: FnLikeNode): string {
  if (node.id?.name !== undefined) return `'${node.id.name}'`;
  const parent = node.parent;
  if (!parent) return '<anonymous>';
  if (parent.type === 'VariableDeclarator') {
    const id = (parent as unknown as { id?: { name?: string } }).id;
    if (id?.name) return `'${id.name}'`;
  }
  if (parent.type === 'MethodDefinition' || parent.type === 'Property') {
    const key = parent.key;
    if (key?.name) return `'${key.name}'`;
  }
  return '<anonymous>';
}
