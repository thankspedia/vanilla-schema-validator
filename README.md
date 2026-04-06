# vanilla-schema-validator

`vanilla-schema-validator` is the validator language and validator factory
system used across the `thankspedia` framework.

## Quick Example

```js
import { schema } from 'vanilla-schema-validator';

schema.define`
  t_color : or(
    equals( << 'red' >> ),
    equals( << 'blue' >> ),
    equals( << 'yellow' >> ),
  ),
  t_profile : object(
    name : string(),
    favorite_color : or(
      t_color(),
      null(),
    ),
  ),
`;

const t_profile = schema.t_profile();

console.log(t_profile({
  name : 'alice',
  favorite_color : 'blue',
}));
// true

console.log(t_profile({
  name : 'alice',
  favorite_color : 'green',
}));
// false
```

This small example already shows the main VSV pattern:

- `schema.define` installs named validator factories into the shared `schema`
  namespace
- `t_profile()` reuses another predefined validator, `t_color()`
- the tagged-template body is VSV script
- the produced validator is still just a JavaScript function you can execute

## Getting Started

The two most important entrypoints are:

- `schema.compile\`...\``
- `schema.define\`...\``

Use `schema.compile` when you want one validator factory back:

```js
const t_login = schema.compile`
  object(
    username : string(),
    password : string(),
  )
`;

console.log(t_login({
  username : 'alice',
  password : 'secret',
}));
// true
```

Use `schema.define` when you want to install named validators into the shared
`schema` namespace and reuse them later:

```js
schema.define`
  t_user_id : uuid(),
  t_profile : object(
    user_id : t_user_id(),
    name : string(),
  ),
`;

const t_profile = schema.t_profile();
```

Good VSV style usually means:

- define stable nouns once and reuse them
- prefer named validators such as `t_user_id()` over repeating the same shape
- keep one authored source of truth in your `.mjs` files
- regenerate derived type/docs output instead of editing generated files

Common mistakes:

- treating VSV as only a string syntax instead of a validator-factory system
- using repeated large anonymous objects when a named validator should exist
- editing generated `types/*` or docs as if they were the source of truth
- explaining VSV through one consumer package instead of on its own terms

This style is valuable because it keeps validators:

- reusable
- traceable
- easy to refine
- aligned with the rest of the framework's runtime contract model

## What VSV Is / What VSV Is Not

VSV is:

- a small schema language
- a validator-factory system
- a shared mutable `schema` namespace
- a tracing/report model for validation
- a metadata layer used by later tooling and documentation

VSV is not:

- a general-purpose programming language
- only a parser for a tiny DSL
- only a bag of helper predicates
- a concept that should be defined through `coretbc`

`coretbc`, `authentication-context`, and the other packages are consumers of
VSV. They are not the authority that defines what VSV is.

## Core Concepts

The core ideas are:

- executable validator factories such as `string()`, `object(...)`, and `or(...)`
- a shared mutable `schema` namespace
- tagged-template compilation through `schema.compile\`...\``
- named validator definition through `schema.define\`...\``
- tracing and runtime diagnostic output
- validator metadata used by later tooling and documentation

That means VSV is not just about checking values. It is also about producing
named, reusable validator artifacts that other framework layers can inspect,
trace, and generate documentation from.

In this repository, VSV is one of the main vocabulary sources for:

- `runtime-typesafety`
- `asynchronous-context`
- `authentication-context`
- `coretbc`

For the reference side of the package, use:

- [SYNTAX.md](SYNTAX.md) for the current grammar and script surface
- [BUILTINS.md](BUILTINS.md) for the built-in validator vocabulary
- [WORKFLOW.md](WORKFLOW.md) for the authoring workflow and source-of-truth rule
- [GENERATION.md](GENERATION.md) for the current generation commands
- [README_HISTORICAL_REFERENCE.md](README_HISTORICAL_REFERENCE.md) for the
  older historical README
