# VSV Built-Ins

This document is the current built-in validator and helper reference for
`vanilla-schema-validator`.

The authoritative implementation is the `standardValis` table in:

- [index.js](index.js)
- [lib/index.mjs](lib/index.mjs)

Use:

- [README.md](README.md) for the narrative introduction
- [SYNTAX.md](SYNTAX.md) for the language syntax
- [WORKFLOW.md](WORKFLOW.md) for the authoring workflow and source-of-truth rule
- [TRACING-AND-REFINEMENT.md](TRACING-AND-REFINEMENT.md) for trace-based
  diagnosis and refinement context
- [README_HISTORICAL_REFERENCE.md](README_HISTORICAL_REFERENCE.md) for the older
  broader README and historical examples

## Reading Rule

The names below are validator factories unless stated otherwise.

For example:

```js
schema.string()
schema.object({ username: schema.string() })
schema.or(schema.string(), schema.number())
```

In VSV script, the same factories are usually written like:

```js
schema.compile`
  object(
    username : string(),
    age : or(number(), null()),
  )
`
```

## Primitive Validators

### `any()`

Always returns `true`.

### `none()`

Always returns `false`.

### `undefined()`

Returns `true` only when `typeof value === 'undefined'`.

### `null()`

Returns `true` only when `value === null`.

### `boolean()`

Returns `true` only for non-null, non-undefined boolean values.

### `number()`

Returns `true` only for non-null, non-undefined number values.

### `string()`

Returns `true` only for non-null, non-undefined string values.

### `bigint()`

Returns `true` only for non-null, non-undefined bigint values.

### `symbol()`

Returns `true` only for non-null, non-undefined symbol values.

### `function()`

Returns `true` only for non-null, non-undefined function values.

## Combinators

### `or(v1, v2, ...)`

Runs every specified validator and succeeds when at least one succeeds.

This implementation still evaluates every branch so the diagnostic context can
record a fuller failure trace.

### `and(v1, v2, ...)`

Runs every specified validator and succeeds only when all of them succeed.

Like `or(...)`, it evaluates all branches for diagnostic purposes.

### `not(v)`

Negates the result of the specified validator.

### `thru(v)`

Passes through the specified validator unchanged.

This is mostly useful when a wrapper position wants an explicit validator node
without changing the result.

## Structural Validators

### `object(def1, def2, ...)`

Validates an object against one or more definition objects.

Each definition object is expected to map property names to validators:

```js
schema.object({
  username: schema.string(),
  age: schema.number(),
})
```

Every declared key must pass its corresponding validator. The implementation is
property-oriented and uses validator hooks internally, which matters for
`defined(...)`.

### `array(v1, v2, ...)`

Validates an array positionally.

```js
schema.array(
  schema.equals('a'),
  schema.equals('b'),
  schema.equals('c'),
)
```

Current behavior:

- input must be an array
- each validator is applied to its corresponding position
- the input length must equal the definition length exactly

This exact-length requirement is part of the current implementation.

### `array_of(v1, v2, ...)`

Validates every element of an array against every specified validator.

The common case is one validator:

```js
schema.array_of(schema.number())
```

With multiple validators, each element must satisfy each validator set that was
supplied.

### `nargs(def1, def2, ...)`

Validates named-argument arrays.

The input is expected to be an array of objects, typically a function's
`...args`. Those objects are folded into one object before validation.

The precedence rule is important:

- left-side argument objects override right-side ones

So:

```js
schema.compile`
  nargs(
    username: string(),
    is_admin: boolean(),
  )
`
```

is designed for patterns such as layered delegation and argument overriding.

### `fold(v1, v2, ...)`

Expects an array of objects, merges that array into one object with
`Object.assign({}, ...array)`, then validates the merged result with the given
validators.

This is close to `nargs(...)`, but conceptually it is a generic fold-then-check
operator rather than a named-arguments-specific one.

### `fold_right(v1, v2, ...)`

Like `fold(...)`, but reverses the input array before folding.

That changes override direction, so it is the right-fold counterpart to
`fold(...)`.

## Value-Specific Validators

### `equals(value)`

Succeeds only when the input is strictly equal to the specified value.

```js
schema.equals(1)(1)   // true
schema.equals(1)('1') // false
```

### `uuid()`

Checks for a canonical hyphenated hexadecimal UUID string.

Current implementation:

- requires a string
- uses a regex against the `8-4-4-4-12` hyphenated shape

### `regexp(re)`

Validates by applying a `RegExp` object to `value.toString()`.

Important current behavior:

- the argument must be an actual `RegExp` instance
- `undefined` and `null` fail immediately
- other values are converted with `toString()` before `re.test(...)`

So the current implementation is broader than "string only".

## Presence-Sensitive Validator

### `defined(subValidator?)`

`defined(...)` is special.

It is mainly meaningful inside key-based validators such as `object(...)` and
`nargs(...)`, because it installs a custom validator hook.

What it does:

- if the key exists, validate that key's value with `subValidator`
- if the key does not exist, treat it as `undefined` for validation purposes

This makes it useful for expressing "the key must exist" or "the key may exist
but must satisfy a validator when present", depending on the sub-validator you
provide.

Examples:

```js
schema.compile`
  object(
    username : defined(string()),
    nickname : defined(or(string(), undefined())),
  )
`
```

With no argument, `defined()` defaults to a validator that always returns
`true`, so by itself it mainly distinguishes presence at the hook level.

## Schema Namespace Helpers

These names are present in the current schema namespace, but they are not normal
validator factories used inside ordinary VSV expressions.

### `compile`

Tagged-template entry point that compiles one validator expression.

### `define`

Tagged-template entry point that defines one or more named validators into the
shared `schema` namespace.

### `statement`

Deprecated alias for `compile`.

### `clone`

Clones the schema namespace.

### `description`

Helper used by the documentation/description path.

### `description_template`

Default description-template helper.

### `BEGIN_MODULE`, `END_MODULE`, `VISIT_MODULE`

Module-loading helpers used by the schema/module system.

## Practical Notes

- The historical README still contains useful examples, but not every detail
  matches current behavior exactly.
- In particular, this current reference should be trusted over older examples
  for:
  - `array(...)` length behavior
  - `regexp(...)` accepting `toString()`-able values rather than only strings
  - the existence of newer entries such as `none()`, `defined()`, `thru()`,
    `fold()`, and `fold_right()`
