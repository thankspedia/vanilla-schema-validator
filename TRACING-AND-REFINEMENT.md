# VSV Tracing And Refinement

Created: `20260407-002753`
Updated: `20260407-002753`

## Purpose

This document explains:

- how VSV tracing works
- how to read trace output
- how runtime evidence can help refine broad validators

The key rule is:

- tracing is for diagnosis
- runtime evidence can suggest better schemas
- authored VSV source remains the final source of truth

## `trace_validator`

Use `trace_validator(validator, value)` when you want to validate a value and
also keep a detailed execution trace.

The current implementation builds a `SchemaValidatorContext` that records:

- the current path stack
- notified validation states
- the target value
- the final boolean result

The result is more than a plain `true` / `false`.
It can produce a detailed report and trace.

Example:

```js
import { schema, trace_validator } from 'vanilla-schema-validator';

schema.define`
  t_color : or(
    equals( << 'red' >> ),
    equals( << 'blue' >> ),
    equals( << 'yellow' >> ),
  ),
  t_profile : object(
    name : string(),
    favorite_color : t_color(),
  ),
`;

const info = trace_validator(schema.t_profile(), {
  name : 'alice',
  favorite_color : 'green',
});

console.log(info.value);
// false

console.log(info.trace());
console.log(info.report());
```

## What The Trace Shows

The trace records the path through nested validators.

Typical trace output shows:

- the current named validator
- nested object keys
- combinator branches such as `or`
- the boolean result at each notified step

That means a trace can answer:

- which branch failed
- how deep the failure was
- whether a reused predefined validator failed internally

This is why preserving trace context across nested predefined validators matters.
Without that context, the outer validator may fail correctly, but the inner
reason becomes opaque.

## `report()` vs `trace()`

The trace context currently exposes two main human-readable views:

- `trace()`
  - focused on the path-level execution sequence
- `report()`
  - combines the target value, validator source, and trace information

In practice:

- use `trace()` when you want the raw path-level diagnostic flow
- use `report()` when you want the fuller validation-failure explanation

## `typecast`

`typecast(validator, value)` is the assertion-oriented companion to tracing.

Current behavior:

1. run `trace_validator(...)`
2. if the value conforms, return the original value unchanged
3. if it does not conform, throw `TypeCastError` with `context.report()`

So `typecast` is not a coercion API.
It is a runtime conformance assertion built on the tracing path.

Use it when you want:

- a validated value or
- an immediate error carrying the trace-backed report

## When To Use Tracing

Tracing is most useful when:

- a validator is large or nested
- a reused predefined validator fails somewhere inside a bigger schema
- an `or(...)` or `and(...)` branch is not behaving as expected
- a method-level runtime contract needs diagnosis

For small one-off checks, a plain boolean validator call may be enough.

For debugging, refinement, and framework-boundary errors, tracing is much more
useful than a bare `false`.

## Refinement From Runtime Evidence

Tracing is part of one larger refinement story.

The current backend stack already records method-level runtime behavior in logs.
Those logs can reveal:

- actual argument shapes
- actual result shapes
- places where generated output validators are still too broad, especially
  `any()`

That makes runtime evidence a practical refinement aid.

## What Runtime Evidence Is Good For

Runtime evidence is good for:

- finding the most-used live methods first
- seeing the actual top-level result wrapper
- discovering repeated stable field shapes
- identifying where a current validator is much too broad

This is especially useful when a generated method output is still:

- `any()`

and a more specific schema clearly exists in practice.

## What Runtime Evidence Is Not Good For

Runtime evidence is not enough to become the only source of truth.

It should not:

- silently overwrite authored validators
- treat one accidental sample as a final domain model
- replace deliberate domain naming with raw structural observation

The rule is:

- runtime data proposes
- authored VSV decides

## Safe Refinement Workflow

The safe current refinement workflow is:

1. use tracing or runtime logs to identify where a validator is too broad or
   failing unexpectedly
2. inspect representative values
3. infer the stable domain shape or wrapper shape
4. write the refined validator in the authored source
5. regenerate derived outputs
6. review the generated files only as projections

That keeps:

- diagnosis
- refinement
- source-of-truth editing

in the right order.

## Limitations And Risks

Runtime evidence has limits.

### Incomplete samples

One sample may show only:

- an empty array
- a wrapper object
- a partial inner shape

So not every observed value is enough to finalize a domain validator.

### Non-JSON log shape

Some current logs are console-style JS-ish output rather than clean JSON.

That means automated extraction may require normalization first.

### Sensitive data

Operational logs may contain sensitive runtime data.

So refinement from logs should assume:

- local/private analysis
- careful scrubbing
- no raw publication of sensitive log material

## Practical Rule

Use tracing to understand validation behavior.
Use runtime evidence to suggest stronger schemas.
But always promote the final result into authored VSV source explicitly.

That is the current tracing and refinement boundary for this package.
