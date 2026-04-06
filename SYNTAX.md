# VSV Syntax

This document describes the current syntax of the VSV schema language used by:

- `schema.compile\`...\``
- `schema.define\`...\``

VSV is a small language for writing validator-factory trees.

Use:

- [README.md](README.md) for the narrative introduction
- [BUILTINS.md](BUILTINS.md) for the current built-in validator vocabulary
- [WORKFLOW.md](WORKFLOW.md) for the authoring workflow and source-of-truth rule
- [TRACING-AND-REFINEMENT.md](TRACING-AND-REFINEMENT.md) for trace-based
  diagnosis and runtime-guided refinement

## Mental Model

Think of VSV as:

- nested validator calls
- plus optional names
- plus comments
- plus a small escape syntax for raw JavaScript values

It is not a general-purpose programming language.

## Smallest Examples

Zero-argument validators:

```txt
string()
number()
uuid()
```

Nested validators:

```txt
array_of( string() )
or( uuid(), null() )
```

Named object fields:

```txt
object(
  username : string(),
  password : string(),
)
```

Named-argument style:

```txt
nargs(
  user_id : uuid(),
  timeline_id : or( uuid(), null() ),
)
```

## Core Grammar

A practical grammar is:

```txt
script        := element*

element       := [comment] [annotation*] [name ":"] expr

expr          := atom ["(" [element ("," element)*] ")"]

annotation    := atom

name          := atom
```

Important notes:

- commas separate sibling elements
- newlines do not separate elements by themselves
- line breaks are formatting only

## Naming With `:`

Use `:` to name either:

- a top-level validator definition
- or a named child under `object(...)` or `nargs(...)`

Top-level example:

```txt
t_user_id : or(
  null(),
  uuid(),
)
```

Nested example:

```txt
object(
  username : string(),
  password : string(),
)
```

## `object(...)` And `nargs(...)`

These two factories are special.

Inside them, child names are preserved as keys:

```txt
object(
  username : string(),
  password : string(),
)
```

```txt
nargs(
  user_id : uuid(),
  scope_id : string(),
)
```

For most other validators, child elements are just positional arguments.

## `schema.compile`

`schema.compile` is usually used when you want one validator factory back.

Example:

```js
const t_login = schema.compile`
  object(
    username : string(),
    password : string(),
  )
`;
```

## `schema.define`

`schema.define` is used when you want to install named validators into the
shared `schema` namespace.

Example:

```js
schema.define`
  t_login_input : object(
    username : string(),
    password : string(),
  ),
  t_login_output : object(
    token : string(),
  ),
`;
```

Top-level multiple definitions still use commas.

## Comments

Block comments:

```txt
/*
 * this comment is attached to the next definition
 */
t_user_id : uuid()
```

Block comments can become validator comment metadata.

Line comments:

```txt
// formatting note only
t_user_id : uuid()
```

Line comments are stripped before parsing and are not used the same way as block
comments.

## Escaped JavaScript Blocks

Use `<< ... >>` when you need a raw JavaScript expression or literal inside VSV.

Examples:

```txt
equals( << 'anonymous' >> )
regexp( << /^[0-9a-zA-Z_-]+$/ >> )
equals( << true >> )
```

This is how VSV bridges into raw JS expression space without making the grammar
much larger.

## Real Repository Examples

Simple `schema.define`:

```js
schema.define`
  test : object(
    name : string(),
  )
`;
```

Real `nargs(...)` usage:

```js
schema.define`
  t_send_tweet_IN : nargs(
    user_id              : or( uuid(), null() ),
    scope_id             : t_scope_id(),
    parent_message_id    : or( uuid(), null() ),
    message_text         : string(),
    message_content_type : or( null(), t_message_content_type() ),
  ),
  t_send_tweet_OUT : any(),
`;
```

## Practical Rules

- Always separate sibling elements with commas.
- Use `:` only for names/keys.
- Use `object(...)` and `nargs(...)` when named children matter.
- Use `/* ... */` for definition comments.
- Use `<< ... >>` for raw JavaScript literals or expressions.
- Do not rely on newlines as syntax.

## Short Reference

Common forms:

```txt
string()
number()
boolean()
uuid()
null()
any()
```

```txt
or( a(), b(), c() )
and( a(), b() )
not( a() )
```

```txt
array( validator() )
array_of( validator() )
object(
  key : validator(),
)
nargs(
  key : validator(),
)
```

## Source Of Truth

The authoritative implementation lives in:

- [index.js](index.js)
- [lib/index.mjs](lib/index.mjs)

This document is a current syntax guide derived from that parser/compiler code
and checked against real usage inside the repository.

For the broader authoring/source-of-truth rule, use [WORKFLOW.md](WORKFLOW.md).
