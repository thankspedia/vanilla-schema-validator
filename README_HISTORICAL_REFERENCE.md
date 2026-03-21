 **vanilla-schema-validator**
================================================================================ 

**vanilla-schema-validator** is a non-opinionated schema validator. It examines
if a specified object conforms to a specified schema definition. It could also
be used as a runtime type detector, validation of JSON objects, etc.

Defining schema definition is done with a simple language called Schema
Validator Definition Language (SVDL).

```javascript
import schema from "vanilla-schema-validator";

schema.define`
  t_color : or(
    equals( << "red" >> ),
    equals( << "blue" >> ),
    equals( << "yellow" >> ),
  ),
  t_person : object(
    name : string(),
    age : number(),
    attrs : object(
      favorite_color : or(
        t_color(),
        null(),
      ),
    ),
  )`;

schema.t_person()({
  name : 'hello',
  age : 20,
  attrs : {
    favorite_color : null,
    foo : 'foo',
  },
})
// true

schema.t_person()({
  name : 'hello',
  age : 20,
  attrs : {
    favorite_color : "green",
    foo : 'foo',
  },
});
// false
```

 Validator Tracer 
--------------------------------------------------------------------------------
It is very frustrating to examine a cause of validation falure especially if
your validator is large and complex; use `trace_validator()` :

```javascript
import { schema, trace_validator } from "vanilla-schema-validator";

schema.define`
  t_color : or(
    equals( << "red" >> ),
    equals( << "blue" >> ),
    equals( << "yellow" >> ),
  ),
  t_person : object(
    name : string(),
    age : number(),
    attrs : object(
      favorite_color : or( 
        t_color(), 
        null(),
      ),
    ),
  )`;

const info = trace_validator( 
  schema.t_person(),
  {
    name : 'hello',
    age : 20,
    attrs : {
      favorite_color : "green",
      foo : 'foo',
    },
  }
);

info.value
/*
  false
 */

info.report(); 
/*
->{begin:t_person}->{op:object}->{name:string} === t
->{begin:t_person}->{op:object}->{age:number} === t
->{begin:t_person}->{op:object}->{attrs:object}->{favorite_color:or}->{0:t_color}->{op:or}->{0:equals} === f
->{begin:t_person}->{op:object}->{attrs:object}->{favorite_color:or}->{0:t_color}->{op:or}->{1:equals} === f
->{begin:t_person}->{op:object}->{attrs:object}->{favorite_color:or}->{0:t_color}->{op:or}->{2:equals} === f
->{begin:t_person}->{op:object}->{attrs:object}->{favorite_color:or}->{0:t_color}->{op:or} === f
->{begin:t_person}->{op:object}->{attrs:object}->{favorite_color:or}->{0:t_color} === f
->{begin:t_person}->{op:object}->{attrs:object}->{favorite_color:or}->{1:null} === f
->{begin:t_person}->{op:object}->{attrs:object}->{favorite_color:or} === f
->{begin:t_person}->{op:object}->{attrs:object} === f
->{begin:t_person}->{op:object} === f
->{begin:t_person} === f
*/
```

 Default Validators
--------------------------------------------------------------------------------
There are a number of predefined validators.

- undefined()
- null()
- boolean()
- number()
- string()
- bigint()
- symbol()
- function()
- any()
- or()
- and()
- not()
- object()
- array()
- equals()
- uuid()

These validators are self-descriptively named so that you might be able to
intuitively grasp how these should be used.

In `vanilla-schema-validator`, every validator is provided as a factory
function which creates and returns a validator function. 

```javascript
console.error( schema.string()(  42  ) ); // false
console.error( schema.string()( '42' ) ); // true
console.error( schema.number()(  42  ) ); // true
console.error( schema.number()( '42' ) ); // false
```

The reason why these validators are provided as factories is that it enables
you to customise your validator by providing any arguments when you instantiate
your validator.

For example, `object()` validator accepts an object which contains validators
to examine fields of a target object of the current validation session.


```javascript
import  { schema } from 'vanilla-schema-validator';

const t_person = schema.object({
  name    : schema.string(),
  age     : schema.number(),
  visited : schema.boolean(),
});

const obj1 = {
  name    :'John',
  age     : 42,
  visited : true,
};
console.error( t_person( obj1 ) ); // true
```

This enables you to create more complex validators.


 Defining Validators
--------------------------------------------------------------------------------
There are two ways of defining a new validator: one is using SVDL as seen in
above and another way is manually writing your own validator as JavaScript
functions.

When you decided to create your validator as JavaScript functions, add a
factory function of the validator as a property of your schema object as
following:


```javascript
import  { schema } from 'vanilla-schema-validator';

schema.is_green = ()=>(v)=>v === 'green';
schema.is_red   = ()=>(v)=>v === 'red';
schema.is_blue  = ()=>(v)=>v === 'blue';

schema.is_green()( "green" ) // true
schema.is_red()( "red" )     // true
schema.is_green()( "white" ) // false

schema.define`
  t_color : or(
    is_green(),
    is_red(),
    is_blue(),
  ),
`;

schema.t_color()( "green" ) // true
schema.t_color()( "red" )   // true
schema.t_color()( "white" ) // false
```

The following is another example:

```javascript
import  { schema } from 'vanilla-schema-validator';

const t_person = schema.object({
  name    : schema.string(),
  age     : schema.number(),
  visited : schema.boolean(),
  since   : (o)=>o instanceof Date,
});

const obj1 = {
  name    :'John',
  age     : 42,
  visited : true,
  since   : new Date('24 Jan 1986 17:58:24 -0700'),
};
console.error( t_person( obj1 ) ); // true

const obj2 = {
  name    :'John',
  age     : 42,
  visited : true,
  since   : { is_wrong_date  : true }
};

console.error( t_person( obj2 ) ); // false
```

Basic concept of this convention is quit simple and with this convention, you
can accomplish validation in most cases without these complicated frameworks.


 Design Goal of **vanilla-schema-validator**
--------------------------------------------------------------------------------

The desigin concept of **vanilla-schema-validator** is based on my own hypothesis. 
My hypothesis states that in JavaScript it is impossible to determine the type
of an object via runtime/compile-time type information; `duck typing` is the
only way to accomplish it.

A type in JavaScript is merely the least expectation to an object. For example,
if you get an object, you might expect that there is a property which name is
`product_id` and as long as there is the property, your code will work as you
expected; otherwise it won't. That is the least expectation to an object.

The design goal of **vanilla-schema-validator** is to exhaustively determine a
type of an object in the sense of described above, with the maximum coverage of
those various corner cases which occur caused via ambiguously defined
JavaScript type system.

The first concern of **vanilla-schema-validator** is by no means readability;
if you expect those sweet syntax suger with function chaining, this is not for
you.


 Terminology of **vanilla-schema-validator**
--------------------------------------------------------------------------------

Usually a validator can be accessed as:

```javascript
  schema.string()('value')
  |  1  |   2    |   3   |
```

In this statement, there are three parts. 

Each part are named as following:

1. `Namespace` ... We call this part `Namespace` . A namespace object keeps a
   number of `Factory` which is explained in 2.
2. `Factory` ... We call this part `Factory`. A `Factory` is a function to create
   a `Validator` which is explained in 3.
3. `Validator` ... We call this part `Validator`. A `Validator` is a function
   which returns `true` if the given value is as expected; otherwise returns
   `false`.

  `prevent-undefined`
--------------------------------------------------------------------------------

[prevent-undefined][] is a debugging tool that prevents generating `undefined`
values via accessing properties by incorrect property names.
`prevent-undefined` supports **vanilla-schema-validator**.

The way to use [prevent-undefined][] with **vanilla-schema-validator** is as following:

```javascript
const t_person_info = schema.object({
  name    : schema.string(),
  age     : schema.number(),
});

const preventUndefined = require('prevent-undefined');
const personInfo = getPersonInfoFromSomewhere();

const protectedPersonInfo = preventUndefined( personInfo, t_person_info() );

console.error( protectedPersonInfo.non_existent_prop  ); // throws an error

protectedPersonInfo.age = 'an invalid number' ; // throws an error
```

For further information, see [prevent-undefined][].

[prevent-undefined]:  https://www.npmjs.com/package/prevent-undefined


 Reference of Predefined Validators
--------------------------------------------------------------------------------
**vanilla-schema-validator** offers a number of basic validators as default.

Available validators are:

- undefined()
- null()
- boolean()
- number()
- string()
- bigint()
- symbol()
- function()
- any()
- or()
- and()
- not()
- object()
- array()
- nargs()
- equals()
- uuid()

Their usage may be self-descriptive; though, some of them should be explaind.


#### `undefined()` ####
Returns `true` if `typeof` operator to the given value returns `undefined`; otherwise returns `false`.
```javascript
schema.undefined()( undefined ) // returns true
schema.undefined()( null      ) // returns false
```

#### `null()` ####
Returns `true` if the given value is strictly equal to `null` value; otherwise returns `false`.
```javascript
schema.null()( null ) // returns true
schema.null()( 1    ) // returns false
```

#### `boolean()` ####
Returns `true` if `typeof` operator to the given value returns `boolean`; otherwise returns `false`.
```javascript
schema.boolean()( false  ) // returns true
schema.boolean()( true   ) // returns true
schema.boolean()( 'true' ) // returns false
```

#### `number()` ####
Returns `true` if `typeof` operator to the given value returns `number`; otherwise returns `false`.
```javascript
schema.number()( 42 ) // returns true
schema.number()('42') // returns false
```

#### `string()` ####
Returns `true` if `typeof` operator to the given value returns `string`; otherwise returns `false`.
```javascript
schema.string()( '42' ) // returns true
schema.string()(  42  ) // returns false
```

#### `bigint()` ####
Returns `true` if `typeof` operator to the given value returns `bigint`; otherwise returns `false`.
```javascript
schema.bigint()( BigInt(42) ) // returns true
schema.bigint()(        42  ) // returns false
```

#### `symbol()` ####
Returns `true` if `typeof` operator to the given value returns `symbol`; otherwise returns `false`.
```javascript
schema.symbol()( Symbol('hello')     ) // returns true
schema.symbol()( Symbol.for('hello') ) // returns true
schema.symbol()(            'hello'  ) // returns false
```

#### `function()` ####
Returns `true` if `typeof` operator to the given value returns `function`; otherwise returns `false`.
```javascript
schema.function()( ()=>{}        ) // returns true
schema.function()( function(){}  ) // returns true
schema.function()( new Function()) // returns true
schema.function()( 'function'    ) // returns false
```

#### `any()` ####
`any()` always return `true` no matter which type of a value is specified as a
parameter.
```javascript
schema.any()( '123' );  // returns true
schema.any()(  123  );  // returns true
schema.any()( true  );  // returns true
```

#### `or()` ####
`or()` calls specified validators from left to right and returns `true` if at
least one of the validators return `true`.  
```javascript
schema.or( schema.string(), schema.number())( '123' );  // returns true
schema.or( schema.string(), schema.number())(  123  );  // returns true
schema.or( schema.string(), schema.number())( true  );  // returns false
```

#### `and()` ####
`and()` calls specified validators from left to right and return `true` if and only if 
all of the specified validators return `true`; otherwise returns `false`.
```javascript
schema.and( schema.number() , (v)=>100<v )( 200 ); // returns true
schema.and( schema.number() , (v)=>100<v )(  50 ); // returns false
```

#### `not()` ####
`not()` negates the result of the specified validator.
```javascript
schema.not( schema.number() )(  100  ); // returns false
schema.not( schema.number() )( '100' ); // returns true
```

#### `object()` ####
`object()` checks the validity of the given object. `object()` receives objects
as its parameters and takes them as definition of the object properties and
create a validator.

The definition objects should contain validators as their properties and these
validators are to be called when the validator performs comparison.

The validator will scan all properties which defined in the definition objects,
then call them with corresponding property values on the object to be compared.

the validator returns `true` if and only if all of the validators returns `true`;
otherwise, returns `false`.

```javascript
const t = schema.object({
  foo : schema.number(),
  bar : schema.string(),
});

t({
}); // returns false

t({
  foo: 100,
  bar: "100",
}); // returns true

```

#### `array()` ####
`array()` takes a number of validators as arguments, then, at the validation,
invokes each validator with its corresponding element in the target array
object.  If the all validators return `true`, `array()` returns `true`;
otherwise returns `false`.

If the number of elements in the target array is not equal to the number of
specified validators, this validator returns `false`.


```javascript
  const validator = schema.compile`
    array(
      equals( <<'a'>> ),
      equals( <<'b'>> ),
      equals( <<'c'>> ),
      )`();

  console.log( validator(['a','b','c']) ); // true 
  console.log( validator(['a','b','d']) ); // false 
  console.log( validator(['a','b','c', 'd' ])); //true 
  console.log( validator(['a','b'          ])); // false 
```
 
#### `array_of()` ####
`array_of()` checks if all of the elements of the given array object conform to a
specified validator. `array_of()` receives a validator and call it with the all of
the elements on the specified array object. Return `true` if all elements conform
to the validator; otherwise return `false`.

```javascript
schema.array_of(schema.number())([1,2,3]); // return true
schema.array_of(schema.number())([1,2,'3']); // return false
schema.array_of(schema.or( schema.string(), schema.number()))([1,2,'3']); // return true
```

#### `nargs()` ####
The `nargs()` validator is used for validation of named arguments. It is named
after abbreviation of "Named Arguments".

The basic idea is:

```javascript
  const t_test_named_arguments = schema.compile`
    nargs(
      age: number(),
      name: string(),
      is_admin: boolean(),
    )`();

  const fn = ( ...args )=>{
    if ( ! t_test_named_arguments( args ) ) {
      throw new Error( 'invalid arguments' );
    }
  };

  // okay
  fn({ age:       23, name:'John', is_admin:false });

  // error
  fn({ age: 'twenty', name:'John', is_admin:false });
```

It has a special protocol that enables overriding. The protocol is based on a
simple rule. The rule is, when multiple arguments are specified, a left-side
argument always overrides the objects in its right-side.

```javascript
  // okay
  fn({ age:23,            }, {          name:'John', is_admin:false} );

  // okay
  fn({ age:23             }, {age:null, name:'John', is_admin:false} );

  // error
  fn({ age:null,          }, {age: 23 , name:'John', is_admin:false} );
```

This protocol was designed for being used with object-delegation in mind.  In
object programming, it is very common to delegate an object by multiple objects.
In such case, sometime it is preferable to override an argument value which is
specified to a delegator before passing the argument to its delegatee.

```javascript
const obj1 ={
  a_method({ hello, world }) {
    console.log( hello, world );
  }
};

const obj2 ={
  a_method({ hello, world }) {
    obj1.a_method({hello:'MODIFIED',world});
  }
};

obj2.a_method({hello:'hello', world:'world'});
```

One problem in the code above is that it is always necessary to manage all
argument names beforehand.  The code above should have been re-written with
three dot spread syntax as following:

```javascript
const obj1 ={
  a_method({ hello,world }) {
    console.log( hello, world );
  }
};

const obj2 ={
  a_method(...nargs) {
    obj1.a_method(...nargs);
  }
};

obj2.a_method({hello:'hello', world:'world'});
```

Three dot syntax is useful. But in this case, it is slightly difficult to
implement overriding named-arguments.


```javascript
const obj1 ={
  a_method({ hello,world }) {
    console.log( hello, world );
  }
};

const obj2 ={
  a_method(...nargs) {
    const nargs2 = Object.assign({},...nargs,{hello:'MODIFIED'});
    obj1.a_method(...nargs2);
  }
};

obj2.a_method({hello:'hello', world:'world'});
```

There is no common consensus about the preferable behavior when multiple named
argument objects are specified. I thought, what if there is a protocol which
states the named argument object in the left-side always takes precedence to the
objects right-side. I thought this would simplify the problem.

The idea has been implemented in the module [`fold-args`][fold-args] and the
module [`runtime-typesafety`][runtime-typesafety].

[fold-args]: (https://github.com/kombucha-js/fold-args)
[runtime-typesafety]: (https://github.com/kombucha-js/runtime-typesafety)

This protocol is extensively used in the framework [Kombucha.js][kombucha]

[kombucha]: (https://github.com/kombucha-js)


#### `equals()` ####
`equals()` takes a parameter as a target value and creates a validator which
compares with the target value. The validator returns `true` if and only if
the given value is strictly equal to the target value.

```javascript
schema.equals(1)(1); // true
schema.equals(1)('1'); // false
```

#### `uuid()` ####
`uuid()` checks if the given value conforms to the specification of [uuid][].

[uuid]: https://en.wikipedia.org/wiki/Universally_unique_identifier

```javascript
schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e67' ) // true
schema.uuid()( 'hello' ) // false
schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7m37e67' ) // false
schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e677' ) // false
schema.uuid()( '2a945d9d-2cfb423b-afb2-362ea7c37e677' ) // false
```

`uuid()` checks if the given value is a string; returns `false` if the given
value is not a string.

```javascript
schema.uuid()( 1  ) // false
schema.uuid()( false ) // false
```

#### `nargs()` ####
`nargs()` validator is designed to validate arguments which are passed to a
function at runtime.

TODO

#### `regexp()` ####
`regexp(arg0)` validator checks if the given value is a string value and confoms
to the pattern which is specified by a RegExp object which is specified as
`arg0`.

```javascript
  schema.regexp( /hello/ )( 'hello' ); // returns true
  schema.regexp( /hello/ )( 'HELLO' ); // returns false

  schema.compile` regexp( << /hello/ >> ) `()( 'hello' );
  // returns true

  schema.compile` regexp( << 'hello' >> ) `()( 'HELLO' );
  // throws "Error: the only argument must be an instance of RegExp() class"

```



 Reference of Schema Validator Definition Language
--------------------------------------------------------------------------------
TODO

#### JavaScript Values in Statement Compiler ####

In the SVDL, regions surrounded by `<<` and `>>` are treated as raw JavaScript
values.

For example,

```javascript
const type = schema.compile`
  object(
    foo : equals( <<  42  >> ),
    bar : equals( << '42' >> ),
  )
`;

is loosely compiled to

```javascript
const type = schema.object({
  foo : schema.equals(  42  ),
  bar : schema.equals( '42' ),
})
```


 Namespace 
--------------------------------------------------------------------------------
The imported `schema` object is the place to store all validators. If you use
modules that depends on **vanilla-schema-validator** while your module depends
on **vanilla-schema-validator**, chances are names of validators are conflict.

In order to avoid name conflict, name your validator a long descriptive name. 

Another way to avoid name conflict is use a separated name space.

```javascript
import  { schema } from 'vanilla-schema-validator';

const schema2 = schema.clone();

schema2.Foo = (...defs)=>(o)=>typeof o ==='number';
schema2.Bar = (...defs)=>(o)=>typeof o ==='string';

const type2 = schema2.compile`
  object(
    foo : Foo(),
    bar : Bar(),
  )
`();

const v = {
  foo:42,
  bar:'hello',
};
console.error( type2( v ) ); // true;


const type1 = schema.compile`
  object(
    foo : Foo(),
    bar : Bar(),
  )
`();
console.error( type1( v ) ); // error;
```


  History
--------------------------------------------------------------------------------
- v0.1.0 released
- v0.1.1 added `uuid()` `equals()`
- v0.1.2 added `clone()`; the template literal function as `rtti.statement`
- v0.1.3 added `any()`
- v0.1.4 added << >> blocks.
- v0.1.5 statement compiler switches namespaces depends on how the validator
         factory  is called.
- v0.1.6 added `array_of()` validator.
         some document correction is also done.
         (Thu, 17 Nov 2022 16:44:33 +0900)
- v0.1.7 more informative error messages
         (Fri, 18 Nov 2022 11:56:11 +0900)
- v0.1.8 more informative error messages
         (Fri, 18 Nov 2022 17:32:01 +0900)
- v1.0.0 The identifiers `array()` and `array_of()` are swapped. Now `array()`
  is called `array_of()` while `array_of()` is called `array()`. This breaks
  backward compatibility.

- v1.0.1 Fixed the broken `array()` validator .

- v1.0.2 Fixed `README.md`.

- v2.0.0 (Tue, 27 Dec 2022 17:48:41 +0900) **vanilla-schema-validator** is released.

(Wed, 14 Dec 2022 14:38:18 +0900) **rtti.js** has been renamed to
**vanilla-schema-validator**.  npm package **rtti.js** is deprecated. 

(Tue, 27 Dec 2022 17:33:45 +0900) `rtti.statement` is renamed `schema.compile`.
`vanilla-schema-validator` is one-hundred percent backward compatible with
former `rtti.js` though.

- v2.0.1

Fixed the issue that `statement compiler` throws an error when a comma is
placed after a specified statement.

- v2.0.2  (Fri, 06 Jan 2023 22:06:22 +0900)

Now it is available to access to the `script` property to get its souce code
for the validators which are generated by factories from statement-compiler
script.

- v2.0.3 (Fri, 06 Jan 2023 22:50:34 +0900)

Fixed the issue that occurs when `array()` validator factory is called with no
arguments.

- v2.0.4 (Sun, 08 Jan 2023 14:20:08 +0900)
  - Added `vali_to_string()`
  - Removed an experimental method `define()`

- v3.0.0 (Fri, 17 Feb 2023 16:02:06 +0900)
  - Migrated `node:test` from `jest`.
  - Added validator-tracer.
  - Added SVDL and abondaned the previous "statemnt script compiler". Though,
    SDL is still almost compatible with statement script compiler", some
    features may break backward-compatibility.
- v3.0.1 (Tue, 21 Feb 2023 13:24:41 +0900)
  - All validators that all compiled validator factories generate return its
    SVDL source code when `toString()` function on a validator is called.

- v3.0.2 (Mon, 08 May 2023 19:10:53 +0900)
  - Stringify instances of SchemaValidatorContext when util.inspect() is called.

- v3.0.3 (Wed, 10 May 2023 19:43:27 +0900)
  - Now `array()` and `array_of()` support `trace_validator`.

- v3.0.4 (Sat, 03 Jun 2023 15:08:52 +0900)
  - Now field name specifiers are available for any types of validators in
    schema compiler; field name specifiers on types other than objects are
    simply ignored, though.

BEFORE: v3.0.4
```
  object(
    foo : number(), // << okay
    bar : number(), // << okay
  ),
  array(
    foo : number(), // << error
    bar : number(), // << error
  ),
  or(
    foo : number(), // << error
    bar : number(), // << error
  ),
```

AFTER: v3.0.4
```
  object(
    foo : number(), // << okay
    bar : number(), // << okay
  ),
  array(
    foo : number(), // << okay
    bar : number(), // << okay
  ),
  or(
    foo : number(), // << okay
    bar : number(), // << okay
  ),
```

- v3.0.5 (Fri, 16 Jun 2023 14:55:29 +0900)
  - Added `typecast` feature that examines the type of the specified value and
    throw an error if the type is not as expected.

- v3.0.6  (Sat, 17 Jun 2023 18:38:57 +0900)
  - Added `typeassert` feature that only examines the type of the specified
    value and show as console.error.

- v3.0.7  (Fri, 19 Jan 2024 15:56:24 +0900)
  - Added `nargs()` and `regexp()` validator.

- v3.0.8 (Tue, 02 Apr 2024 15:19:31 +0900)
  - Migrated from `schema.statement` to `schema.compile`.

- v3.0.9 (Wed, 10 Apr 2024 18:27:52 +0900)
  - Added `vsv build` command to accumulate every type definition and output it
    as ESM modules. This feature has not been published yet to NPM public
    repository.
  - Added `fold()` and `fold_right()`. This hasn't been published,too.
  - Print the dump of the target value and the source code of the current
    validator. (Wed, 17 Apr 2024 16:03:25 +0900)

- v3.0.10 (Thu, 25 Apr 2024 18:11:19 +0900)
  - Fixed a bug that a validator fails when the number of static interpolators
    exceeds 10. (not released)
  - (Fri, 17 May 2024 14:09:37 +0900)
  - Added schema.none() validator which always returns `false`. (not released)
  - Added some test suites to check some corner cases of and()/or() logical
    operators. (not released)
  - (Tue, 21 May 2024 15:47:59 +0900)
  - unprevent-undefined() before trace. (not released)
  - (Fri, 24 May 2024 17:56:03 +0900)
  - Added an experimental validator `defined()` (not released)
  - (Wed, 29 May 2024 13:49:15 +0900)
  - Added Markdown documentation converter to VSV documentation tool (not
    released)


 Conclusion
--------------------------------------------------------------------------------
This documentation is not perfect and there are still a lot of things which
should be on this document.

Thank you very much for your attention.

[Atsushi Oka][] / I'm from Tokyo. For further information, see my github account.

[Atsushi Oka]: https://github.com/a-oka-z/


<!-- vim: set sw=2 sts=2 ts=2: -->
