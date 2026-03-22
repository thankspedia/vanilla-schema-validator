# vanilla-schema-validator

Current README placeholder.

This submodule originally had a `README.md`.
It has been preserved as `README_HISTORICAL_REFERENCE.md`.

A new current README can be written here.

## Current Overview

`vanilla-schema-validator` is the validator language and validator factory
system used across the `thankspedia` framework.

It provides:

- executable validator factories such as `string()`, `object(...)`, and `or(...)`
- a shared mutable `schema` namespace
- tagged-template compilation through `schema.compile\`...\``
- named validator definition through `schema.define\`...\``
- tracing and runtime diagnostic output
- validator metadata used by later tooling and documentation

In this repository, it is one of the main vocabulary sources for:

- `runtime-typesafety`
- `asynchronous-context`
- `authentication-context`
- `coretbc`

## VSV

The small schema language used by this package is referred to here as VSV.

Use:

- [SYNTAX.md](SYNTAX.md) for the current syntax reference
- [README_HISTORICAL_REFERENCE.md](README_HISTORICAL_REFERENCE.md) for the older
  historical README

The most common forms are:

```js
schema.compile`string()`

schema.compile`
  object(
    username : string(),
    password : string(),
  )
`

schema.define`
  t_login_input : object(
    username : string(),
    password : string(),
  ),
  t_login_output : object(
    token : string(),
  ),
`
```

## Practical Reading

The easiest way to understand the package is:

1. VSV describes validator trees.
2. `schema.compile` returns one validator factory.
3. `schema.define` installs named validator factories into `schema`.
4. The produced validators are used later by runtime contracts in the framework.

## Parser And Compiler

The actual parser/compiler lives in:

- [index.js](index.js)
- [lib/index.mjs](lib/index.mjs)

The syntax documentation in [SYNTAX.md](SYNTAX.md) was reconstructed from those
parser/compiler sources and checked against real examples in the repository.
