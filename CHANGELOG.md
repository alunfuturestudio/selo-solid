# Changelog

All notable changes to `selo-solid` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/) — pre-1.0 the contract is allowed to break in `MINOR` bumps.

## [Unreleased]

### Added

- **`isp/max-interface-members`** — last v1 rule from researchui#190. Walks `TSInterfaceDeclaration` and `TSTypeLiteral`; counts `TSPropertySignature` + `TSMethodSignature` per node. Default goal 10. Seal message points at split-by-client (Reader/Writer pattern). ([0fe413c](https://github.com/guilhermesilveira/selo-solid/commit/0fe413c))

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
