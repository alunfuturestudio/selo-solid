# selo-solid

A `selo` rule pack with SOLID-alike rules. Use with [`@guilhermesilveira/selo`](https://github.com/guilhermesilveira/selo).

## Rules

| Rule id | Type | Default unit | What it caps |
|---|---|---|---|
| `srp/max-file-lines` | threshold | `lines` | source lines per file |
| `srp/max-function-lines` | threshold | `lines/fn` | source lines per function |
| `srp/max-params` | threshold | `params/fn` | parameters per function |
| `srp/max-depth` | threshold | `depth/fn` | max nesting depth per function |
| `srp/max-statements-per-function` | threshold | `stmts/fn` | top-level statements per function |
| `srp/max-cyclomatic-complexity` | threshold | `CC/fn` | McCabe cyclomatic complexity per function |
| `srp/max-class-methods` | threshold | `methods` | `MethodDefinition` count per class |
| `isp/max-interface-members` | threshold | `members` | `TSPropertySignature` + `TSMethodSignature` count per interface (and per `TSTypeLiteral`) |
| `ocp/no-type-discriminating-switch` | count | `dispatches` | switch / if-else-if chains over a single discriminator (kind/type/__typename/tag) |

Each rule's seal message names the unit value and the next refactor — never the bare "too many X."

## Install

```sh
npm install --save-dev @guilhermesilveira/selo selo-solid
```

## Use

In `selo.config.mjs`:

```js
import solid from 'selo-solid';

export default {
  packs: [solid],
  rules: {
    'srp/max-file-lines':              { goal: 800 },
    'srp/max-function-lines':          { goal: 80 },
    'srp/max-params':                  { goal: 4 },
    'srp/max-depth':                   { goal: 4 },
    'srp/max-statements-per-function': { goal: 30 },
    'srp/max-cyclomatic-complexity':   { goal: 15 },
    'srp/max-class-methods':           { goal: 10 },
    'isp/max-interface-members':       { goal: 10 },
    'ocp/no-type-discriminating-switch': {},
  },
};
```

Then `npx selo check` (see the [selo README](https://github.com/guilhermesilveira/selo) for the full workflow).

## OCP exemptions

The OCP rule sometimes fires on legacy code you can't refactor immediately. Exempt those files at the project level:

```js
'ocp/no-type-discriminating-switch': {
  exempt: ['lib/legacy-dispatcher.ts', 'ui/old/Page.tsx'],
},
```

Paths are project-relative. The list is meant to be temporary — refactor and remove.

## Layout

```
src/
  index.ts                     pack export (default + named rule exports)
  lib/walk.ts                  AST walker, function-name lookup, FN_TYPES
  rules/srpMaxFileLines.ts
  rules/srpMaxFunctionLines.ts
  rules/srpMaxParams.ts
  rules/srpMaxDepth.ts
  rules/srpMaxStatementsPerFunction.ts
  rules/srpMaxCyclomaticComplexity.ts
  rules/srpMaxClassMethods.ts
  rules/ispMaxInterfaceMembers.ts
  rules/ocpNoTypeDiscriminatingSwitch.ts
tests/
  helpers.ts                   fixtureFile() — parse + set parents
  *.test.ts                    one focused test per rule
```

## Adding a rule

1. New file under `src/rules/` exporting a `SeloRule` object. Use `walkAst`/`walkAstSkip` from `lib/walk.js`. Skip descent at nested function nodes if the measurement is per-function.
2. Add to `src/index.ts`'s `rules` map under its `meta.id`.
3. Test under `tests/<name>.test.ts` using `fixtureFile()` to build a `SeloFile`.

## Releasing

Manual SemVer release flow. See [@guilhermesilveira/selo's release notes](https://github.com/guilhermesilveira/selo#releasing) for the engine-releases-first ordering — when `@guilhermesilveira/selo`'s contract changes, the engine ships first, then this pack bumps its peer range and follows.

```sh
# 1. Move [Unreleased] in CHANGELOG.md under a new
#    `## [<version>] — YYYY-MM-DD` heading.
# 2. If the engine bumped, update peerDependencies."@guilhermesilveira/selo"
#    in package.json.
# 3. npm version patch        # 0.0.1 → 0.0.2 (or `minor` / `major`)
# 4. git push --follow-tags
# 5. npm publish               # one-time `npm login` first
```

The `prepublishOnly` script gates publishing on a clean build + tests + lint, so a broken state can't ship.

---

## What is *not* in this pack

- `srp/no-identical-functions` and `srp/max-cognitive-complexity` rely on SonarJS's algorithms. They live in [`selo-eslint-raiz`](https://github.com/guilhermesilveira/selo-eslint-raiz) (the shim pack) where the wrapping mechanism handles them.
