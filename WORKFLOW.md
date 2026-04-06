# VSV Workflow

Created: `20260407-002020`
Updated: `20260407-002020`

## Purpose

This document explains the current VSV authoring workflow and the source-of-truth
rule.

The most important point is:

- authored source files are the source of truth
- generated `types/*` and documentation outputs are derived artifacts

## Source Of Truth

Write VSV definitions in the authored source modules that define the real
application or framework contract.

Typical authoring locations are:

- dedicated schema files such as `authentication-context/schema.mjs`
- runtime contract files such as `coretbc/context.mjs`
- other `.mjs` files that call `schema.compile\`...\`` or
  `schema.define\`...\``

Do not treat generated files as the primary editing surface.

Generated files should be:

- regenerated
- reviewed as projections
- not edited by hand as if they were canonical source

## `schema.compile` vs `schema.define`

Use `schema.compile` when you want one validator factory back immediately.

Typical use:

- local inline validator
- one-off helper
- small direct runtime check

Example:

```js
const t_login = schema.compile`
  object(
    username : string(),
    password : string(),
  )
`;
```

Use `schema.define` when you want to install named validators into the shared
`schema` namespace.

Typical use:

- shared domain nouns
- reusable contract pieces
- validators that other schemas should call by name

Example:

```js
schema.define`
  t_user_id : uuid(),
  t_profile : object(
    user_id : t_user_id(),
    name : string(),
  ),
`;
```

So in workflow terms:

- `compile` is for obtaining one validator
- `define` is for growing the shared validator vocabulary

## Preferred Authoring Style

The preferred style is:

- define stable nouns first
- reuse those nouns in larger validators
- avoid repeating large anonymous object shapes when a reusable named validator
  should exist
- keep generated outputs downstream from the authored `.mjs` source

This matters because VSV is used as:

- executable validation
- shared schema vocabulary
- generated type/documentation source

So duplication in authored validators creates drift in several layers at once.

## Two Levels Of Definition

VSV definitions usually appear at two levels.

### Domain validators

These are reusable named validators such as:

- `t_profile`
- `t_user_id`
- `t_permission_type`

These should express stable domain vocabulary.

### Method contract validators

These are method-level validators such as:

- `typesafe_input`
- `typesafe_output`
- related description metadata

Generated artifacts later expose those as derived names such as:

- `t_typesafety_input_of_<method>`
- `t_typesafety_output_of_<method>`

Those generated names are projections of the authored method contract, not the
primary authoring surface.

## Generated Artifacts

Typical generated outputs include:

- `types/*.mjs`
- `docs/*.markdown`
- `docs/*.html`

These outputs are useful because they make the authored validator set easier to:

- share
- inspect
- document

But they are still derived artifacts.

If they are wrong, fix the authored source and regenerate.

## Generation Path

The generator looks for files that opt in through source directives such as:

- `#VANILLA_SCHEMA_VALIDATOR ENABLE TRANSPILE`
- `#VANILLA_SCHEMA_VALIDATOR ENABLE DOCUMENTATION`

It also expects a VSV module declaration such as:

- `schema.BEGIN_MODULE(...)`

The generator commands are described in more detail in [GENERATION.md](./GENERATION.md).

Common commands are:

```bash
vsv build --input-dir=. --output-dir=types
vsv build-md --input-dir=. --output-dir=docs
vsv build-html --input-dir=. --output-dir=docs
```

Some packages wrap these through package scripts such as:

- `npm run build`
- `npm run build-md`
- `npm run build-html`

If a package wrapper behaves differently, check that package's `package.json`.

## Safe Workflow

The safe current workflow is:

1. edit the authored `.mjs` source
2. define or refine reusable named validators first
3. attach explicit method-level validators where needed
4. regenerate the derived outputs
5. review the generated files only as projections

That means:

- source first
- generated outputs second

not the other way around.

## Runtime Refinement Rule

Runtime logs and observed values can help refine broad validators, especially
when an output is still `any()`.

But runtime observation should only be used to:

- suggest candidate schemas
- reveal broad or weak definitions
- guide manual refinement

It should not:

- silently overwrite authored schemas
- become the only source of truth

The rule is:

- runtime data proposes
- authored VSV decides

## Practical Rule

When maintaining VSV definitions:

- edit authored source
- regenerate derived outputs
- do not hand-edit generated `types/*` or docs
- prefer named reusable validators over repeated anonymous shapes

That is the current workflow boundary this package expects.
