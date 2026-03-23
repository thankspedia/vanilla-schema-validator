# VSV Generation

This note explains how VSV-driven transpilation and documentation generation
work.

It covers:

- how to invoke the commands
- which source directives are recognized
- what each command generates

## CLI Commands

The CLI entrypoint is:

- `vsv`

It is provided by [bin/vsv.mjs](bin/vsv.mjs).

Available commands:

- `vsv build`
- `vsv build-doc`
- `vsv build-html`
- `vsv build-md`

Typical invocation form:

```bash
vsv build --input-dir=. --output-dir=types
vsv build-md --input-dir=. --output-dir=docs
vsv build-html --input-dir=. --output-dir=docs
```

The commands traverse files under `--input-dir` and inspect only files with the
selected extensions. The default extensions are:

- `mjs`
- `cjs`
- `js`

## Recognized Directives

The transpiler currently recognizes two source directives:

- `#VANILLA_SCHEMA_VALIDATOR ENABLE TRANSPILE`
- `#VANILLA_SCHEMA_VALIDATOR ENABLE DOCUMENTATION`

They are matched by the transpiler in
[lib/transpiler.mjs](lib/transpiler.mjs).

Meaning:

- `ENABLE TRANSPILE`
  makes the file eligible for `vsv build`

- `ENABLE DOCUMENTATION`
  makes the file eligible for:
  - `vsv build-doc`
  - `vsv build-html`
  - `vsv build-md`

So the directives are not general annotations.
They are the actual inclusion switches used by the generator.

## `schema.BEGIN_MODULE(...)`

The source file also needs to declare a VSV module.

The module entrypoint is:

- `schema.BEGIN_MODULE(...)`

Implemented in:

- [lib/index.mjs](lib/index.mjs)

Current parameters:

- `module_name`
- `header`
- `footer`
- `output_filename`
- `filename`
- `dirname`

Typical usage:

```js
/*
 * #VANILLA_SCHEMA_VALIDATOR ENABLE TRANSPILE
 * #VANILLA_SCHEMA_VALIDATOR ENABLE DOCUMENTATION
 */
schema.BEGIN_MODULE({
  ...import.meta,
  module_name: 'coretbc',
  output_filename: 't_context.mjs',
  footer: '',
});
```

Important points:

- `filename` and `dirname` are expected to come from `import.meta`
- `output_filename` overrides the generated base filename
- `module_name`, `header`, and `footer` are module metadata used by the
  generator path

## What Each Command Generates

The output behavior is defined in
[lib/transpiler.mjs](lib/transpiler.mjs).

### `vsv build`

Generates transpiled source output.

Output filename rule:

- `module.output_filename ?? module.filename`

That path is then placed under `--output-dir`.

For a module with:

- `output_filename : 't_context.mjs'`

and:

- `--output-dir=types`

the output becomes something like:

- `types/t_context.mjs`

### `vsv build-html`

Generates HTML documentation.

Output filename rule:

- `(module.output_filename ?? module.filename) + '.html'`

With:

- `--output-dir=docs`

the output becomes something like:

- `docs/t_context.mjs.html`

### `vsv build-md`

Generates Markdown documentation.

Output filename rule:

- `(module.output_filename ?? module.filename) + '.markdown'`

With:

- `--output-dir=docs`

the output becomes something like:

- `docs/t_context.mjs.markdown`

### `vsv build-doc`

This is a convenience wrapper.

It runs:

- `build_html(...)`
- then `build_md(...)`

So it generates:

- HTML documentation
- Markdown documentation

It does not generate the transpiled source output by itself.

## Practical Workflow

The normal safe workflow is:

```bash
vsv build --input-dir=. --output-dir=types
vsv build-md --input-dir=. --output-dir=docs
vsv build-html --input-dir=. --output-dir=docs
```

This gives:

- transpiled VSV output
- Markdown docs
- HTML docs

in separate steps.

## Consumer Package Wrappers

Consumer packages may wrap these commands in their own `package.json` scripts.

For example, a package can define:

- `npm run build`
- `npm run build-md`
- `npm run build-html`
- `npm run build-doc`

But those wrapper scripts may add extra side effects beyond VSV itself.

So if a package-level script behaves unexpectedly, check that package's
`package.json`.

The VSV CLI behavior described here is only the generator behavior itself.

## Recommended Rule

When recovering or debugging a generation workflow:

1. check the source file for:
   - `ENABLE TRANSPILE`
   - `ENABLE DOCUMENTATION`
   - `schema.BEGIN_MODULE(...)`
2. run `vsv build` for transpiled output
3. run `vsv build-md` and/or `vsv build-html` for docs
4. check package-specific wrapper scripts separately if they exist
