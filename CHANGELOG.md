# Changelog

All notable changes to `selo-solid` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/) — pre-1.0 the contract is allowed to break in `MINOR` bumps.

## [Unreleased]

### Added

- **`ocp/no-instanceof-chain`** — sibling to `ocp/no-type-discriminating-switch`. Walks `IfStatement` and `ConditionalExpression` chains; flags ladders of `instanceof` checks against the same discriminator (compared structurally — identifier, `this`, or member-access path). Single guards do not fire. Default `minBranches: 2`. Seal points at polymorphism / visitor / handler-registry as the open-extension refactor.

## [0.1.0] — 2026-04-29

### Added

- **`isp/max-interface-members`** — last v1 rule from researchui#190. Walks `TSInterfaceDeclaration` and `TSTypeLiteral`; counts `TSPropertySignature` + `TSMethodSignature` per node. Default goal 10. Seal message points at split-by-client (Reader/Writer pattern). ([0fe413c](https://github.com/guilhermesilveira/selo-solid/commit/0fe413c))

### Changed

- **Peer dependency** — `@guilhermesilveira/selo` peer range moved from `^0.0.1` to `^0.1.0`. Required to pick up the count-rule ratchet fix and the arrived-state goal-clamp.

## [0.0.1] — Initial release

Eight SOLID-alike rules ported from the legacy ESLint plugin to the [`@guilhermesilveira/selo`](https://github.com/guilhermesilveira/selo) `SeloRule` contract:

- `srp/max-file-lines`
- `srp/max-function-lines`
- `srp/max-params`
- `srp/max-depth`
- `srp/max-statements-per-function`
- `srp/max-cyclomatic-complexity`
- `srp/max-class-methods`
- `ocp/no-type-discriminating-switch` (with project-level `exempt` list)

Each rule is a self-contained file under `src/rules/`, depending only on `lib/walk.ts` (AST walker, function-name resolver, FN_TYPES). The OCP non-suppressible-inline mechanism from the previous build is gone — selo isn't ESLint, so there's no `eslint-disable` to fight; suppression is project-config-only by construction.
