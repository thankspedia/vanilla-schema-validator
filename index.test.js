

function getStackFromError(o) {
  if ( o == null ) {
    return o;
  } else if ( typeof o === 'object' ) {
    if ( 'stack' in o ) {
      if ( Array.isArray( o.stack ) ) {
        return o.stack;
      } else {
        if ( typeof o.stack === 'string' ) {
          return o.stack.split('\n');
        } else {
          // 1. this could be erroneous value but we ignore it.
          // 2. ensure it to be an array.
          return [ o.stack] ;
        }
      }
    } else {
      // ensure the result is an array.
      return [];
    }
  } else {
    // cannot retrieve stack; but we have to ensure it to be an array.
    return [];
  }
}

function filterErrorToJSONFriendly(o) {
  if ( o instanceof Error ) {
    return {
      message : o.message,
      stack   : getStackFromError( o ),
      cause   : filterErrorToJSONFriendly( o.cause ),
    };
  } else if ( o === null ) {
    return null;
  } else if ( o === undefined ) {
    return undefined;
  } else if ( typeof o === 'object' ) {
    return Object.assign( Array.isArray( o ) ? [] : {}, ... Object.keys(o).map(k=>({[k]:filterErrorToJSONFriendly(o[k])})));
  } else {
    return o;
  }
}

describe('basic',()=>{
  it('as undefined' , ()=>{  assert.equal       ( schema.undefined (                )(undefined       ),true                ); } );
  it('as null'      , ()=>{  assert.equal       ( schema.null      (                )(null            ),true                ); } );
  it('as boolean 1' , ()=>{  assert.equal       ( schema.boolean   (                )(true            ),true                ); } );
  it('as boolean 2' , ()=>{  assert.equal       ( schema.boolean   (                )(false           ),true                ); } );
  it('as number'    , ()=>{  assert.equal       ( schema.number    (                )(100000          ),true                ); } );
  it('as string'    , ()=>{  assert.equal       ( schema.string    (                )("fooo"          ),true                ); } );
  it('as bigint'    , ()=>{  assert.equal       ( schema.bigint    (                )(BigInt(1)       ),true                ); } );
  it('as symbol'    , ()=>{  assert.equal       ( schema.symbol    (                )(Symbol('1')     ),true                ); } );
  it('as function'  , ()=>{  assert.equal       ( schema.function  (                )(()=>{}          ),true                ); } );
  it('as function'  , ()=>{  assert.equal       ( schema.function  (                )(function(){}    ),true                ); } );
  it('as function'  , ()=>{  assert.equal       ( schema.function  (                )(new Function('')),true                ); } );
  it('as or ERR'    , ()=>{  assert.throws      ( ()=>schema.or    (                )(                ), new RangeError( 'no definition was specified in `or`' )  ); } );
  it('as and ERR'   , ()=>{  assert.throws      ( ()=>schema.and   (                )(                ), new RangeError( 'no definition was specified in `and`' )  ); } );
  it('as not ERR'   , ()=>{  assert.throws      ( ()=>schema.not   (                )(                ), new RangeError( 'no definition was specified in `not`' )  ); } );
  it('as or OK'     , ()=>{
    assert.doesNotThrow(
      ()=>{
        debugger;
        return schema.or(schema.number())();
      }
    );
  });
  it('as and OK'    , ()=>{  assert.doesNotThrow( ()=>schema.and   (schema.number() )(                )   ); } );
  it('as not OK'    , ()=>{  assert.doesNotThrow( ()=>schema.not   (schema.number() )(                )   ); } );
});

/**
 * The primitive evaluators always return false when the given argument is
 * undefined or null, unless they are either undefined() or null().
 */
describe( 'check null', ()=>{
  it( 'as undefined()( undefined) ', ()=>assert.equal( schema.undefined()( undefined  ), true  ) );
  it( 'as null()( undefined )',      ()=>assert.equal( schema.null()     ( undefined  ), false ) );
  it( 'as undefined()( null )',       ()=>assert.equal( schema.undefined()( null       ), false ) );
  it( 'as null()( null )',            ()=>assert.equal( schema.null()     ( null       ), true  ) );
  it( 'as boolean()',            ()=>assert.equal( schema.boolean()  ( null       ), false ) );
  it( 'as number()',             ()=>assert.equal( schema.number()   ( null       ), false ) );
  it( 'as string()',             ()=>assert.equal( schema.string()   ( null       ), false ) );
  it( 'as bigint()',             ()=>assert.equal( schema.bigint()   ( null       ), false ) );
  it( 'as symbol()',             ()=>assert.equal( schema.symbol()   ( null       ), false ) );
  it( 'as function()',           ()=>assert.equal( schema.function() ( null       ), false ) );
});

/**
 * test `not`
 */
describe( 'check not', ()=>{
  it( 'as 0 not(string())( false         )===true'  , ()=>assert.equal( schema.not( schema.string())( false         ), true  ));
  it( 'as 1 not(string())( "some string" )===false' , ()=>assert.equal( schema.not( schema.string())( "some string" ), false ));
  it( 'as 2 not(string())( 12345 + 234   )===true'  , ()=>assert.equal( schema.not( schema.string())( 12345 + 234   ), true  ));
  it( 'as 3 not(string())( null          )===true'  , ()=>assert.equal( schema.not( schema.string())( null          ), true  ));
  it( 'as 4 not(string())( 1             )===true'  , ()=>assert.equal( schema.not( schema.string())( 1             ), true  ));
  it( 'as 5 not(string())( BigInt(100)   )===true'  , ()=>assert.equal( schema.not( schema.string())( BigInt(100)   ), true  ));
});

describe( 'check or', ()=>{
  it( 'as or()...0', ()=>assert.equal( schema.or( schema.number(), schema.string()                )( false         ), false ));
  it( 'as or()...1', ()=>assert.equal( schema.or( schema.number(), schema.string()                )( "some string" ), true  ));
  it( 'as or()...2', ()=>assert.equal( schema.or( schema.number(), schema.string()                )( 12345 + 234   ), true  ));
  it( 'as or()...3', ()=>assert.equal( schema.or( schema.number(), schema.string()                )( null          ), false ));
  it( 'as or()...4', ()=>assert.equal( schema.or( schema.number(), schema.string(), schema.null() )( null          ), true  ));
  it( 'as or()...5', ()=>assert.equal( schema.or( schema.number(), schema.string(), schema.null() )( 1             ), true  ));
  it( 'as or()...6', ()=>assert.equal( schema.or( schema.number(), schema.string(), schema.null() )( BigInt(100)   ), false ));
});

/*
 * test `and`
 *
 * Notice you should not find yourself to check if it is null or undefined
 * since all primitive evaluators return false when the argument is either
 * undefined or null.
 */
describe( 'check and', ()=>{
  it( 'as 0',  ()=>assert.equal( schema.and( schema.undefined(), schema.not(schema.null()      ))( undefined      ),  true  ));
  it( 'as 1',  ()=>assert.equal( schema.and( schema.null(),      schema.not(schema.undefined() ))( null           ),  true  ));
  it( 'as 2',  ()=>assert.equal( schema.and( schema.boolean(),   schema.not(schema.null()      ))( false          ),  true  ));
  it( 'as 3',  ()=>assert.equal( schema.and( schema.number(),    schema.not(schema.null()      ))( 10000          ),  true  ));
  it( 'as 4',  ()=>assert.equal( schema.and( schema.string(),    schema.not(schema.null()      ))( "hello"        ),  true  ));
  it( 'as 5',  ()=>assert.equal( schema.and( schema.bigint(),    schema.not(schema.null()      ))( BigInt(1)      ),  true  ));
  it( 'as 6',  ()=>assert.equal( schema.and( schema.symbol(),    schema.not(schema.null()      ))( Symbol('foo')  ),  true  ));
  it( 'as 7',  ()=>assert.equal( schema.and( schema.function(),  schema.not(schema.null()      ))( ()=>{}         ),  true  ));

  it( 'as 8',  ()=>assert.equal( schema.and( schema.undefined(), schema.not(schema.null()      ))( null           ),  false ));
  it( 'as 9',  ()=>assert.equal( schema.and( schema.null(),      schema.not(schema.undefined() ))( undefined      ),  false ));
  it( 'as 10', ()=>assert.equal( schema.and( schema.boolean(),   schema.not(schema.null()      ))( null           ),  false ));
  it( 'as 11', ()=>assert.equal( schema.and( schema.number(),    schema.not(schema.null()      ))( null           ),  false ));
  it( 'as 12', ()=>assert.equal( schema.and( schema.string(),    schema.not(schema.null()      ))( null           ),  false ));
  it( 'as 13', ()=>assert.equal( schema.and( schema.bigint(),    schema.not(schema.null()      ))( null           ),  false ));
  it( 'as 14', ()=>assert.equal( schema.and( schema.symbol(),    schema.not(schema.null()      ))( null           ),  false ));
  it( 'as 15', ()=>assert.equal( schema.and( schema.function(),  schema.not(schema.null()      ))( null           ),  false ));
});

describe( 'check the corner cases of and/or logical operators' ,()=>{
  it( '`and` with no argument', ()=>{
    assert.throws(()=>schema.and()(undefined), Error );
  });
  it( '`or` with no argument', ()=>{
    assert.throws(()=>schema.or ()(undefined), Error );
  });
  it( '`and` with an only argument', ()=>{
    assert.equal( schema.and(schema.any())(undefined),  true );
    assert.equal( schema.and(schema.none())(undefined), false );
  });
  it( '`or` with an only argument', ()=>{
    assert.equal( schema.or(schema.any())(undefined), true );
    assert.equal( schema.or(schema.none())(undefined), false );
  });
});

describe('check object',()=>{
  const def = schema.object({
    a:schema.boolean(),
    b:schema.number(),
  });
  it( 'as 0', ()=> assert.equal( def({ a:true, b:1,     }),  true  ));
  it( 'as 1', ()=> assert.equal( def({ a:1,    b:1,     }),  false ));
  it( 'as 2', ()=> assert.equal( def({ a:true, b:false, }),  false ));
  it( 'as 3', ()=> assert.equal( def({ a:1   , b:false, }),  false ));
});


describe('check array_of',()=>{
  const def = schema.array_of(
    schema.number(),
  );

  it('0', ()=>assert.equal( def([0,         1,   2,       3,    4,    5]),  true  ));
  it('1', ()=>assert.equal( def([0,         1,   2,   false,    4,    5]),  false ));
  it('2', ()=>assert.equal( def([0,         1,   2,       3, "ff",    5]),  false ));
  it('3', ()=>assert.equal( def([0, BigInt(1),   2,       3,    4,    5]),  false ));
});


describe('check object with date', ()=>{
  const t_person = schema.object({
    name    : schema.string(),
    age     : schema.number(),
    visited : schema.boolean(),
    since   : (o)=>o instanceof Date,
  });

  const val4 = {
    name    :'John',
    age     : 42,
    visited : true,
    since   : new Date('24 Jan 1986 17:58:24 -0700'),
  };

  const val5 = {
    name    :'John',
    age     : 42,
    visited : true,
    since   : { is_wrong_date  : true }
  };

  it( '0', ()=>assert.equal( t_person( val4 ), true ));
  it( '1', ()=>assert.equal( t_person( val5 ), false ));
});


/*
 *
 */

/*
 * the standard statement compiler ( v2 )
 */
test('STATEMENT COMPILER test basic 1.1 ( with annotations )', ()=>{
  const factory = schema./*st*/compile`
    foo
    bar
    object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: string(),
        bar: number(),
      ),
      arr_test : array_of(
        not( number()),
      ),
    )
  `;

  assert.equal( factory.toString() ,
`function __t_anonymous(...args) {
    const schema = this === undefined ? self : this;
    try {
      const validator = schema.thru(
        schema.object({
          name:schema.string(),
          age:schema.number(),
          field:schema.or(
            schema.number(),
            schema.string()
          ),
          attrs:schema.object({
            foo:schema.string(),
            bar:schema.number()
          }),
          arr_test:schema.array_of(
            schema.not(
              schema.number()
            )
          )
        })
      );
` +
     '      Object.defineProperties(validator,{\n' +
     '        "validator_name" : {\n' +
     '          value : "__t_anonymous", \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "factory_name" : {\n' +
     '          value : "__t_anonymous", \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "validator_raw_source" : {\n' +
     '          value : `object(\n' +
     '            name : string(),\n' +
     '            age  : number(),\n' +
     '            field : or( number(), string() ),\n' +
     '            attrs : object(\n' +
     '              foo: string(),\n' +
     '              bar: number(),\n' +
     '            ),\n' +
     '            arr_test : array_of(\n' +
     '              not( number()),\n' +
     '            ),\n' +
     '          )\n' +
     '          ` , \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : false,   \n' +
     '        },\n' +
     '        "validator_source" : {\n' +
     '          get: \n' +
     '            (function (nargs) {\n' +
     "              if ( this?.validator_name === '__t_anonymous' ) {\n" +
     '                return (\n' +
     '                    "          "\n' +
     '                  + this?.validator_raw_source ?? ""\n' +
     '                )\n' +
     '              } else {\n' +
     '                return (\n' +
     '                    "          "\n' +
     '                  + ( this?.validator_name ?? "" )\n' +
     '                  + ":"\n' +
     '                  + ( this?.validator_raw_source ?? "")\n' +
     '                );\n' +
     '              }\n' +
     '            })\n' +
     '          , \n' +
     '          enumerable   : false,   \n' +
     '          configurable : false,   \n' +
     '        },\n' +
     '        "toString" : {\n' +
     '          value : ()=>this?.validator_source ?? "UNDEFINED(S)", \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "validator_annotations" : {\n' +
     '          value        : [ "foo","bar" ],\n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "validator_comment" : {\n' +
     '          get: function validator_comment() { return null } , \n' +
     '          enumerable   : false,   \n' +
     '          configurable : false,   \n' +
     '        },\n'+
     '      });' +
`
      return validator;
    } catch ( e ) {
      e.source = __t_anonymous.toString();
      e.schema = schema;
      throw e;
    }
    }`
  );

  const vali = factory();
  console.error({factory,vali});
});



// note that this test is identical with test basic 1.1
// The only difference is absence of the annotations.
// see 'annotations'
test('STATEMENT COMPILER test basic 1.2 ( without annotations )', ()=>{
  const factory = schema./*st*/compile`
    object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: string(),
        bar: number(),
      ),
      arr_test : array_of(
        not( number()),
      ),
    )
  `;

  assert.equal( factory.toString() ,
`function __t_anonymous(...args) {
    const schema = this === undefined ? self : this;
    try {
      const validator = schema.thru(
        schema.object({
          name:schema.string(),
          age:schema.number(),
          field:schema.or(
            schema.number(),
            schema.string()
          ),
          attrs:schema.object({
            foo:schema.string(),
            bar:schema.number()
          }),
          arr_test:schema.array_of(
            schema.not(
              schema.number()
            )
          )
        })
      );
` +
     '      Object.defineProperties(validator,{\n' +
     '        "validator_name" : {\n' +
     '          value : "__t_anonymous", \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "factory_name" : {\n' +
     '          value : "__t_anonymous", \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "validator_raw_source" : {\n' +
     '          value : `object(\n' +
     '            name : string(),\n' +
     '            age  : number(),\n' +
     '            field : or( number(), string() ),\n' +
     '            attrs : object(\n' +
     '              foo: string(),\n' +
     '              bar: number(),\n' +
     '            ),\n' +
     '            arr_test : array_of(\n' +
     '              not( number()),\n' +
     '            ),\n' +
     '          )\n' +
     '          ` , \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : false,   \n' +
     '        },\n' +
     '        "validator_source" : {\n' +
     '          get: \n' +
     '            (function (nargs) {\n' +
     "              if ( this?.validator_name === '__t_anonymous' ) {\n" +
     '                return (\n' +
     '                    "          "\n' +
     '                  + this?.validator_raw_source ?? ""\n' +
     '                )\n' +
     '              } else {\n' +
     '                return (\n' +
     '                    "          "\n' +
     '                  + ( this?.validator_name ?? "" )\n' +
     '                  + ":"\n' +
     '                  + ( this?.validator_raw_source ?? "")\n' +
     '                );\n' +
     '              }\n' +
     '            })\n' +
     '          , \n' +
     '          enumerable   : false,   \n' +
     '          configurable : false,   \n' +
     '        },\n' +
     '        "toString" : {\n' +
     '          value : ()=>this?.validator_source ?? "UNDEFINED(S)", \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "validator_annotations" : {\n' +
     '          value        : [  ],\n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "validator_comment" : {\n' +
     '          get: function validator_comment() { return null } , \n' +
     '          enumerable   : false,   \n' +
     '          configurable : false,   \n' +

     '        },\n' +
     '      });' +
`
      return validator;
    } catch ( e ) {
      e.source = __t_anonymous.toString();
      e.schema = schema;
      throw e;
    }
    }`
  );

  const vali = factory();
  console.error({factory,vali});
});


















describe('STATEMENT COMPILER test basic 2', ()=>{
  it( '0', ()=>assert.equal( schema./*st*/compile`string()`()('hello') ,  true  ));
  it( '1', ()=>assert.equal( schema./*st*/compile`string()`()( 123   ) ,  false ));
  it( '2', ()=>assert.equal( schema./*st*/compile`number()`()( 123   ) ,  true  ));
  it( '3', ()=>assert.equal( schema./*st*/compile`number()`()('hello') ,  false ));
});


describe( 'check compiler', ()=>{
  it('as undefined' , ()=>{  assert.equal       (     schema./*st*/compile`undefined ()`           ()(undefined   ), true        ); } );
  it('as null'      , ()=>{  assert.equal       (     schema./*st*/compile`null      ()`           ()(null        ), true        ); } );
  it('as boolean 1' , ()=>{  assert.equal       (     schema./*st*/compile`boolean   ()`           ()(true        ), true        ); } );
  it('as boolean 2' , ()=>{  assert.equal       (     schema./*st*/compile`boolean   ()`           ()(false       ), true        ); } );
  it('as number'    , ()=>{  assert.equal       (     schema./*st*/compile`number    ()`           ()(100000      ), true        ); } );
  it('as string'    , ()=>{  assert.equal       (     schema./*st*/compile`string    ()`           ()("fooo"      ), true        ); } );
  it('as bigint'    , ()=>{  assert.equal       (     schema./*st*/compile`bigint    ()`           ()(BigInt(1)   ), true        ); } );
  it('as symbol'    , ()=>{  assert.equal       (     schema./*st*/compile`symbol    ()`           ()(Symbol('1') ), true        ); } );
  it('as function'  , ()=>{  assert.equal       (     schema./*st*/compile`function  ()`           ()(()=>{}      ), true        ); } );
  it('as not ERR'   , ()=>{  assert.throws      ( ()=>schema./*st*/compile`not       (           )`()(            ),  RangeError ); } );
  it('as or ERR'    , ()=>{  assert.throws      ( ()=>schema./*st*/compile`or        (           )`()(            ),  RangeError ); } );
  it('as and ERR'   , ()=>{  assert.throws      ( ()=>schema./*st*/compile`and       (           )`()(            ),  RangeError ); } );
  it('as not OK'    , ()=>{  assert.doesNotThrow( ()=>schema./*st*/compile`not       (number()   )`()(            ),             ); } );
  it('as or OK'     , ()=>{  assert.doesNotThrow( ()=>schema./*st*/compile`or        (number()   )`()(            ),             ); } );
  it('as and OK'    , ()=>{  assert.doesNotThrow( ()=>schema./*st*/compile`and       (number()   )`()(            ),             ); } );
});




/*
 * equals() and uuid()
 */

describe('check equals',()=>{
  it( '0', ()=>assert.equal( schema.equals( 'hello' )( 'hello'    ) ,  true  ));
  it( '1', ()=>assert.equal( schema.equals( 'hello' )( 'NO hello' ) ,  false ));
  it( '2', ()=>assert.equal( schema.equals( 123     )( '123'      ) ,  false ));
  it( '3', ()=>assert.equal( schema.equals( false   )( 'false'    ) ,  false ));
  it( '4', ()=>assert.equal( schema.equals( false   )( false      ) ,  true  ));
  it( '5', ()=>assert.equal( schema.equals( null    )( undefined  ) ,  false ));
  it( '6', ()=>assert.equal( schema.equals( null    )( null       ) ,  true  ));
});

describe('check uuid',()=>{
  it( '0', assert.equal( schema.uuid()( 'hello'    ) ,  false ));
  it( '1', assert.equal( schema.uuid()( 'NO hello' ) ,  false ));
  it( '2', assert.equal( schema.uuid()( '123'      ) ,  false ));
  it( '3', assert.equal( schema.uuid()( 'false'    ) ,  false ));
  it( '4', assert.equal( schema.uuid()( false      ) ,  false ));
  it( '5', assert.equal( schema.uuid()( undefined  ) ,  false ));
  it( '6', assert.equal( schema.uuid()( null       ) ,  false ));
  it( '7', assert.equal( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e67'  ) ,  true  ));
  it( '8', assert.equal( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7m37e67'  ) ,  false ));
  it( '9', assert.equal( schema.uuid()( '2a945d9d-2cfb-423b-afb2-362ea7c37e677' ) ,  false ));
  it( '10',assert.equal( schema.uuid()( '2a945d9d-2cfb423b-afb2-362ea7c37e677'  ) ,  false ));
});



/*
 * clone()
 */
describe('check equals',()=>{
  it( 'as 1', ()=>{
    // 0. clone the standard `schema` object.
    const rtti1 = schema.clone();
    const hello = (o)=>o==='hello';
    const world = (o)=>o==='world';
    const value = 'world';

    // 1. set constructor `hello` to the first cloned object.
    rtti1.hello = hello;
    assert.equal( 'hello' in rtti1 ,  true );
    assert.doesNotThrow( ()=>rtti1./*st*/compile`hello()`( value ) );

    // 2. clone again and confirm if the constructor `hello` is available on the
    //    second cloned object.
    const rtti2 = rtti1.clone();
    assert.equal( 'hello' in rtti2 ,  true );
    assert.doesNotThrow( ()=>rtti2./*st*/compile`hello()`( value ) );

    // 3.  confirm that setting `hello` does not affect to the original schema
    //     object.
    assert.equal( 'hello' in schema ,  false );
    assert.throws( ()=>schema./*st*/compile`hello()`( value ) );

    // 4.  set constructor `world to the second cloned object.
    rtti2.world = world;
    assert.equal( 'world' in rtti2 ,  true );
    assert.equal( 'world' in rtti1 ,  false );
    assert.doesNotThrow( ()=>rtti2./*st*/compile`world()`( value ) );
    assert.throws( ()=>rtti1./*st*/compile`world()`( value ) );
  });
});



/*
 * any()
 */

describe( 'check any', ()=>{
  it( 'as undefined'  , ()=>{ assert.equal( schema.any()( undefined       ), true); } );
  it( 'as null'       , ()=>{ assert.equal( schema.any()( null            ), true); } );
  it( 'as boolean'    , ()=>{ assert.equal( schema.any()( false           ), true); } );
  it( 'as number'     , ()=>{ assert.equal( schema.any()( 1               ), true); } );
  it( 'as string'     , ()=>{ assert.equal( schema.any()( '1'             ), true); } );
  it( 'as bigint'     , ()=>{ assert.equal( schema.any()( BigInt(1)       ), true); } );
  it( 'as symbol'     , ()=>{ assert.equal( schema.any()( Symbol.for('1') ), true); } );
  it( 'as function'   , ()=>{ assert.equal( schema.any()( ()=>{}          ), true); } );
});




/**
 *
 * JavaScript Blocks in the Statement Compiler
 *
 */
// it's much time consuming to create compiler test in this way; skip this until another way is invented.
// (Mon, 20 Feb 2023 18:09:28 +0900)
describe( 'check statement compiler 1 JavaScript Block',{skip:true},()=>{
  it('as JavaScript Blocks No.1', ()=>{
    const factory = schema./*st*/compile`
      object(
        name : string(),
        age  : number(),
        field : or( number(), string() ),
        attrs : object(
          foo: equals( << "hello world" >> ),
          bar: number(),
        ),
        arr_test : array_of(
          not( number()),
        ),
      )
    `;

    assert.equal( factory.toString() ,
`function __t_anonymous(...args) {
    const schema = this === undefined ? self : this;
    try {
      const validator = schema.thru(
        schema.object({
          name:schema.string(),
          age:schema.number(),
          field:schema.or(
            schema.number(),
            schema.string()
          ),
          attrs:schema.object({
            foo:schema.equals(
              t__static_value_0_interpolator()
            ),
            bar:schema.number()
          }),
          arr_test:schema.array_of(
            schema.not(
              schema.number()
            )
          )
        })
      );
` +
     '      Object.defineProperties(validator,{\n' +
     '        "validator_name" : {\n' +
     '          value : "__t_anonymous", \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "factory_name" : {\n' +
     '          value : "__t_anonymous", \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '        "toString" : {\n' +
     '          value : ()=>`object(\n' +
     '            name : string(),\n' +
     '            age  : number(),\n' +
     '            field : or( number(), string() ),\n' +
     '            attrs : object(\n' +
     '              foo: string(),\n' +
     '              bar: number(),\n' +
     '            ),\n' +
     '            arr_test : array_of(\n' +
     '              not( number()),\n' +
     '            ),\n' +
     '          )` , \n' +
     '          enumerable   : false,   \n' +
     '          writable     : false,   \n' +
     '          configurable : true,    \n' +
     '        },\n' +
     '      });' +
`
      return validator;
    } catch ( e ) {
      e.source = __t_anonymous.toString();
      e.schema = schema;
      throw e;
    }
    }
  }`);

    const vali = factory();
    console.error({factory,vali});
  });



  it('as JavaScript Blocks No.2', ()=>{
    const factory = schema./*st*/compile`
      object(
        name : equals( << "John Coltrane" >> ),
        age  : number(),
        field : or( number(), string() ),
        attrs : object(
          foo: equals( << "hello world" >> ),
          bar: number(),
        ),
        arr_test : array_of(
          not( number()),
        ),
      )
    `;

    assert.equal( factory.toString() ,
        'function __t_anonymous(...args) {\n' +
      '    const schema = this === undefined ? self : this;\n' +
      '    try {\n' +
      '      const validator = schema.thru(\n' +
      '        schema.object({\n' +
      '          name:schema.equals(\n' +
      '            t__static_value_0_interpolator()\n' +
      '          ),\n' +
      '          age:schema.number(),\n' +
      '          field:schema.or(\n' +
      '            schema.number(),\n' +
      '            schema.string()\n' +
      '          ),\n' +
      '          attrs:schema.object({\n' +
      '            foo:schema.equals(\n' +
      '              t__static_value_1_interpolator()\n' +
      '            ),\n' +
      '            bar:schema.number()\n' +
      '          }),\n' +
      '          arr_test:schema.array_of(\n' +
      '            schema.not(\n' +
      '              schema.number()\n' +
      '            )\n' +
      '          )\n' +
      '        })\n' +
      '      );\n' +
      '      validator.validator_name = "__t_anonymous";\n' +
      '      validator.factory_name = "__t_anonymous";\n' +
      '      return validator;\n' +
      '    } catch ( e ) {\n' +
      '      e.source = __t_anonymous.toString();\n' +
      '      e.schema = schema;\n' +
      '      throw e;\n' +
      '    }\n' +
      '  }'
    );

    const vali = factory();
    console.error({factory,vali});
  });

  it('as JavaScript Blocks No.3', ()=>{
    const factory = schema./*st*/compile`equals(<<10>>)`;
    assert.equal(
      factory.toString() ,

      'function __t_anonymous(...args) {\n' +
      '    const schema = this === undefined ? self : this;\n' +
      '    try {\n' +
      '      const validator = schema.thru(\n' +
      '        schema.equals(\n' +
      '          t__static_value_0_interpolator()\n' +
      '        )\n' +
      '      );\n' +
      '      validator.validator_name = "__t_anonymous";\n' +
      '      validator.factory_name = "__t_anonymous";\n' +
      '      return validator;\n' +
      '    } catch ( e ) {\n' +
      '      e.source = __t_anonymous.toString();\n' +
      '      e.schema = schema;\n' +
      '      throw e;\n' +
      '    }\n' +
      '  }'
    );
    const vali = factory();
    console.error({factory,vali});
  });

  it('as JavaScript Blocks No.4', ()=>{
    const factory = schema./*st*/compile`number(<<>>)`;
    assert.equal( factory.toString() ,
      'function __t_anonymous(...args) {\n' +
      '    const schema = this === undefined ? self : this;\n' +
      '    try {\n' +
      '      const validator = schema.thru(\n' +
      '        schema.number(\n' +
      '          t__static_value_0_interpolator()\n' +
      '        )\n' +
      '      );\n' +
      '      validator.validator_name = "__t_anonymous";\n' +
      '      validator.factory_name = "__t_anonymous";\n' +
      '      return validator;\n' +
      '    } catch ( e ) {\n' +
      '      e.source = __t_anonymous.toString();\n' +
      '      e.schema = schema;\n' +
      '      throw e;\n' +
      '    }\n' +
      '  }'
    );
    const vali = factory();
    console.error({factory,vali});
  });


  it('as JavaScript Blocks No.5', ()=>{
    assert.throws( ()=>{
      const factory = schema./*st*/compile`number(<<1 + >><<2 + >><<3>>)`;
      assert.equal( factory.toString() , `schema.number(1 + 2 + 3)`.trim());
      const vali = factory();
      console.error({factory,vali});
    });
  });
});



describe('check clone', ()=>{
  it( 'as 1', ()=>{
    const v = 'HELLO';

    // create namespace1.
    const rtti1 = schema.clone();

    // set a validator factory as `hello`.
    rtti1.hello = ()=>(o)=>o === 'hello' ;

    // this should be false.
    assert.equal( rtti1./*st*/compile`hello()`()( v ) ,  false );

    // create namespace2.
    const rtti2 = schema.clone();

    // override `hello` as a different factory.
    rtti2.hello =()=>(o)=>o === 'HELLO';

    // `hello` should refer different factories depends on which namespace it is
    // called with.
    assert.equal( rtti1./*st*/compile`hello()`()( v ) ,  false );
    assert.equal( rtti2./*st*/compile`hello()`()( v ) ,  true );

    // this looks like it refers `rtti2.hello`
    const factory_by_rtti2 = rtti2./*st*/compile`hello()`;

    // set its namespace to `rtti1`
    rtti1.hello2 = factory_by_rtti2;

    // factory_by_rtti2 is called in the context of rtti1; this should refer
    // `rtti1.hello`; so this should be false.
    assert.equal( rtti1.hello2()( v ) ,  false );

    // if `factory_by_rtti2` is called without namespace, it refers the `rtti2`
    // where `factory_by_rtti2` comes from.
    assert.equal( factory_by_rtti2()( v ) ,  true );

  });
});


test( 'check array No.1', ()=>{
  const validator = schema./*st*/compile`
    array(
      equals( << 'a' >> ),
      equals( << 'b' >> ),
      equals( << 'c' >> ),
      )`();

  assert.equal( validator(['a','b','c']) ,  true );
  assert.equal( validator(['a','b','d']) ,  false );
  assert.equal( validator(['a','b','c', 'd' ]) ,  false );
  assert.equal( validator(['a','b'          ]) ,  false );

});



test( 'object with undefined No.1', ()=>{
  assert.equal( schema./*st*/compile`
    object(
      a: or(
        undefined(),
        string()
      )
    )`()(
      {
      }
    ),  true );
  assert.equal( schema./*st*/compile`
    object(
      a: string()
    )`()(
      {
      }
    ),  false );
});


// test( 'informative error message No.1 ', ()=>{
//   assert.equal( ()=>schema./*st*/compile`
//     object(
//       a: string
//     )`()(
//       {
//       }
//     ), (e)=>e.message === "the specified validator returned a function not a boolean in `object`; probably you forgot to call your validator factory?\n\n    schema.object({\n      a: schema.string\n    })" );
// });



// it's much time consuming to create compiler test in this way; skip this until another way is invented.
// (Mon, 20 Feb 2023 18:09:28 +0900)
test('check statement compiler 2 / returned validators have `script` property 1', { skip : true },  ()=>{
  const factory = schema./*st*/compile`
    object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: equals( << "hello world" >> ),
        bar: number(),
      ),
      arr_test : array_of(
        not( number()),
      ),
    )
  `;

  assert.equal( factory.toString() ,
    'function __t_anonymous(...args) {\n' +
    '    const schema = this === undefined ? self : this;\n' +
    '    try {\n' +
    '      const validator = schema.thru(\n' +
    '        schema.object({\n' +
    '          name:schema.string(),\n' +
    '          age:schema.number(),\n' +
    '          field:schema.or(\n' +
    '            schema.number(),\n' +
    '            schema.string()\n' +
    '          ),\n' +
    '          attrs:schema.object({\n' +
    '            foo:schema.equals(\n' +
    '              t__static_value_0_interpolator()\n' +
    '            ),\n' +
    '            bar:schema.number()\n' +
    '          }),\n' +
    '          arr_test:schema.array_of(\n' +
    '            schema.not(\n' +
    '              schema.number()\n' +
    '            )\n' +
    '          )\n' +
    '        })\n' +
    '      );\n' +
    '      validator.validator_name = "__t_anonymous";\n' +
    '      validator.factory_name = "__t_anonymous";\n' +
    '      return validator;\n' +
    '    } catch ( e ) {\n' +
    '      e.source = __t_anonymous.toString();\n' +
    '      e.schema = schema;\n' +
    '      throw e;\n' +
    '    }\n' +
    '  }'
  );
  console.error({factory});
});


// it's much time consuming to create compiler test in this way; skip this until another way is invented.
// (Mon, 20 Feb 2023 18:09:28 +0900)
test('check statement compiler 3 / returned validators have `script` property 2', { skip : true }, ()=>{
  const factory = schema./*st*/compile`   << (e)=>e===1>>   `;

  assert.equal( factory()( 1 ) ,  true );
  assert.equal( factory()( 2 ) ,  false );

  assert.equal( factory.toString().trim() ,
    'function __t_anonymous(...args) {\n' +
    '    const schema = this === undefined ? self : this;\n' +
    '    try {\n' +
    '      const validator = schema.thru(\n' +
    '        t__static_value_0_interpolator()\n' +
    '      );\n' +
    '      validator.validator_name = "__t_anonymous";\n' +
    '      validator.factory_name = "__t_anonymous";\n' +
    '      return validator;\n' +
    '    } catch ( e ) {\n' +
    '      e.source = __t_anonymous.toString();\n' +
    '      e.schema = schema;\n' +
    '      throw e;\n' +
    '    }\n' +
    '  }'
  );

  console.error({factory});
});



describe( 'check context', ()=>{
  const factory = schema./*st*/compile`
    t_test_hello:object(
      name : string(),
      age  : number(),
      field : or( number(), string() ),
      attrs : object(
        foo: equals( << "hello world" >> ),
        bar: number(),
        not_attrs : not(
          object(
          ),
        ),
        sub_attrs : object(
          baz : object(
            qux : object(
              hello : string(),
            ),
          ),
        ),
      ),

      arr_test : and(
        array_of(
          not( null()),
          not( undefined()),
        ),
        array(
          boolean(),
          string(),
          number(),
          number(),
        ),
      )
    )
  `;

  it( 'as', ()=>{
    const o = {
      name : 'hello',
      age : 15,
      field : '15',
      attrs : {
        foo : 'hello world',
        bar : 15,
        sub_attrs : {
          baz : {
            qux : {
              hello : "aaa",
            },
          },
        },
      },
      arr_test : [ false, 'boo', 15 ],
    };
    /*
    COMMENT OUT
    (Tue, 28 May 2024 15:46:31 +0900)
    console.log( 'trace_validator' );
    console.log( trace_validator( factory(), o ).report() );
    */
    // const c = new SchemaValidatorContext();
    // const r = factory()(o ,c);
    // console.log( 'source', factory[SCHEMA_VALIDATOR_SOURCE], 'result', c.toString() );
  });
});

describe( 'new_standard_template_literal', {only:true},  ()=>{
  it('new_standard_template_literal as 0', ()=>{
    assert.throws( ()=>{
      const result = schema.compile`
        foo:object( ^ )
      `;
      console.error( 'result',result );
    });
  });

  it('new_standard_template_literal as 1', ()=>{
     const result = schema.compile`
      object(
      )
    `
    console.error( 'result',result);
  });

  it('new_standard_template_literal as 2', ()=>{
     const result = schema.compile`
      t_args : object(
      )
    `
    console.error( 'result',result);
  });

  it('new_standard_template_literal as 3', ()=>{
     const result = schema.compile`
      t_args : object(
        foo : object
      )
    `
    console.error( 'result',result);
  });

  it('new_standard_template_literal as 4', ()=>{
     const result = schema.compile`
      t_args : object(
        foo : object()
      )
    `
    console.error( 'result',result);
  });

  it('new_standard_template_literal as 5', ()=>{
     const result = schema.compile`
      t_args : object(
        foo : object,
        bar : object
      )
    `
    console.error( 'result',result);
  });


  it('new_standard_template_literal as 6',()=>{
    assert.throws( ()=>{
      const result = schema.compile`
        t_args : object(
          foo : object,
          bar : object
          bar : object,
        )
      `
      console.error( 'result6',result);
    }, new Error('missing comma') )
  });


  it('new_standard_template_literal as 7',{only:true},()=>{
     const result = schema.compile`
      object(
        foo : and(
          number(),
          equals( << 1 >> ),
          // aaa
          //
          /*
          foo(), // ee
          bar(),
          a
          */
          /*
           * HOO * *
           * HOO
           * HOO
           */BAR(),
          // aaaa
          equals( << 1 >> ),
        ),
      )
    `
    console.error( 'result',result);
  });

  it('new_standard_template_literal as 8',()=>{
    assert.throws( ()=>{
      const result = schema.compile`
        t_args : object(
          bar : object,
        ))
      `
      console.error( 'result8',result);
    }, new Error('probably found an unmatched parenthesis') )
  });

  it('new_standard_template_literal as 9',()=>{
    assert.throws( ()=>{
      const result = schema.compile`
        t_args : object((
          bar : object,
        )
      `
      console.error( 'result9',result);
    }, new Error('expected a keyword but missing') )
  });

  it('new_standard_template_literal as 10',()=>{
    assert.throws( ()=>{
      const result = schema.compile`
        t_args : object((
          bar : object,
        ))
      `
      console.error( 'result10',result);
    }, new Error('expected a keyword but missing') )
  });

});

describe( "new_standard_template_literal 2", ()=>{
  const s = schema.clone();
  s.define`
    t_color : or(
      equals( << "red" >>),
      equals( << "blue" >>),
      equals( << "yellow" >>),
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
    )
  `;

  assert.equal( typeof s.t_person , 'function' );

  assert.equal( s.t_person()({
    name : 'hello',
    age : 20,
    attrs : {
      favorite_color : null,
      foo : 'foo',
    },
  }), true);

  /*
  COMMENT OUT
  (Tue, 28 May 2024 15:46:31 +0900)
  console.log( trace_validator( s.t_person(),{
    name : 'hello',
    age : 20,
    attrs : {
      favorite_color : "green",
      foo : 'foo',
    },
  }).report());
  */
});


describe( "escaping illegal characters" ,()=>{
  it( 'as 0', ()=>{
    const s = schema.clone();
    s.define`
      t_color : or(
        equals( << "red" >>),
        equals( << "blue\`"  >>),
        equals( << "yellow" >>),
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
      )
    `;

    assert.doesNotThrow(()=>{
        console.error('source',s.t_color().toString()  );
    });
  });
});


describe( "typecast" ,()=>{
  it( 'as 0', ()=>{
    const s = schema.clone();
    s.define`
      t_color : or(
        equals( << "red" >>),
        equals( << "blue\`"  >>),
        equals( << "yellow" >>),
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
      )
    `;

    assert.doesNotThrow(()=>{
      console.error( 'source', typecast( s.t_color(), 'red' ) );
    });
    assert.doesNotThrow(()=>{
      console.error( 'source', typecast( s.t_person(), {
        name : 'hello',
        age : 10,
        attrs : {
          favorite_color : 'red',
        },
      }));
    });
    assert.throws(()=>{
      console.error('source', typecast( s.t_color(), 'green') );
    });
    assert.throws(()=>{
      try {
        console.error( 'source', typecast( s.t_person(), {
          name : 'hello',
          age : 10,
          attrs : {
            favorite_color : 'green',
          },
        }));
      } catch (e) {
        console.error('expected error',e);
        throw e;
      }
    });
  });
});



test( 'nargs No.1', ()=>{
  const validator = schema./*st*/compile`
    nargs(
      foo: equals( << 'a' >> ),
      bar: equals( << 'b' >> ),
      baz: equals( << 'c' >> ),
    )`();


  assert.equal( validator( [                     {foo:'a',bar:'b',baz:'c'},                           ] ),  true );
  assert.equal( validator( [                     {foo:'a',bar:'b',baz:'c'}, {foo:'A',bar:'B',baz:'C'} ] ),  true );
  assert.equal( validator( [                     {foo:'a',bar:'b',       }, {foo:'A',bar:'B',baz:'c'} ] ),  true );
  assert.equal( validator( [ {foo:'INCORRECT' }, {foo:'a',bar:'b',baz:'c'}, {foo:'A',bar:'B',baz:'C'} ] ), false );


});

test( 'nargs No.2', ()=>{
  const t_test_named_arguments = schema./*st*/compile`
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

  assert.doesNotThrow(()=>{
    fn({age:20,       name:'bar',is_admin:false });
  });

  assert.throws(()=>{
    fn({age:'twenty', name:'bar',is_admin:false });
  });


  // okay
  assert.doesNotThrow(()=>{
    fn({ age:23,            }, {          name:'John', is_admin:false} );
  });

  // okay
  assert.doesNotThrow(()=>{
    fn({ age:23             }, {age:null, name:'John', is_admin:false} );
  });

  // error
  assert.throws(()=>{
    fn({ age:null,          }, {age: 23 , name:'John', is_admin:false} );
  });

});


test( 'regexp0', ()=>{
  assert.equal( schema.regexp( /hello/ )( 'hello' ), true );
  assert.equal( schema.regexp( /hello/ )( 'hell' ),  false );
  assert.equal( schema./*st*/compile` regexp( << /hello/ >> ) `()( 'hello' ), true );
  assert.equal( schema./*st*/compile` regexp( << /hello/ >> ) `()( 'HELLO' ), false );
  assert.throws(
    ()=>schema./*st*/compile` regexp( << 'hello' >> ) `()( 'HELLO' )
  );

});

test( 'regexp1', ()=>{
  const validator = schema./*st*/compile`
    nargs(
      hello: regexp( << /hello/ >> ),
      world: regexp( << /world/ >> ),
    )`();


  assert.equal( validator( [                     {hello:'hello', world:'world', },                           ] ), true  );
  assert.equal( validator( [                     {hello:'hello', world:'worl',  },                           ] ), false );


});


/**
 * Mon, 18 Mar 2024 13:53:44 +0900
 */
describe( "typecast" ,()=>{
  it( 'as 0', ()=>{
    const s = schema.clone();
    s.define`
      col dre
      t_color : or(
        equals( << "red" >>),
        equals( << "blue"  >>),
        equals( << "yellow" >>),
      ),

      foo
      bar
      t_person : object(
        name   : string(),
        age    : number(),
        attrs : object(
          favorite_color : or(
            t_color(),
            null(),
          ),
        ),
      )
    `;

    assert.doesNotThrow(()=>{
      console.error();
      console.error( 'source of t_color()');
      console.error( s.t_color().toString() );
      console.error( s.t_color.toString() );
      console.error();
      console.error( 'source of t_person()' );
      console.error( s.t_person().toString() );
      console.error( s.t_person.toString() );
    });
    assert.doesNotThrow(()=>{
      console.error( 't_person()', typecast( s.t_person(), {
        name : 'hello',
        age : 10,
        attrs : {
          favorite_color : 'red',
        },
      }));
    });
    assert.throws(()=>{
      console.error('source', typecast( s.t_color(), 'green') );
    });
    assert.throws(()=>{
      try {
        console.error( 'source', typecast( s.t_person(), {
          name : 'hello',
          age : 10,
          attrs : {
            favorite_color : 'green',
          },
        }));
      } catch (e) {
        console.error('expected error',e);
        throw e;
      }
    });
  });
});



describe( "validator_command" ,()=>{
  it( 'as 0', ()=>{
    const s = schema.clone();
    s.BEGIN_MODULE('hello');
    s.define`
      col dre
      t_color : or(
        equals( << "red" >>),
        equals( << "blue"  >>),
        equals( << "yellow" >>),
      ),

      foo
      bar
      t_person : object(
        name   : string(),
        age    : number(),
        attrs : object(
          favorite_color : or(
            t_color(),
            null(),
          ),
        ),
      )
    `;
    s.END_MODULE();

    console.log('asdf',s.t_person().toString() );
    console.log('asdf',Object.getOwnPropertyDescriptors( s.t_person) );
    const result = s.t_person.validator_command({command:'self'});
    console.log('asdf', result );

    assert.equal( s.t_person, result );
  });

  it( 'as 1', ()=>{
    const s = schema.clone();
    s.BEGIN_MODULE('hello');
    s.define`
      col dre
      t_color : or(
        equals( << "red" >>),
        equals( << "blue"  >>),
        equals( << "yellow" >>),
      ),

      foo
      bar
      t_person : object(
        name   : string(),
        age    : number(),
        attrs : object(
          favorite_color : or(
            t_color(),
            null(),
          ),
        ),
      ),
    `;
    s.END_MODULE();
    console.log( 's.t_person', s.t_person );
    assert.equal( s.t_person.name, 't_person'  );
    s.t_person.validator_command({command:'name', value:'t_foo_bar_bum'});
    assert.equal( s.t_person.name, 't_foo_bar_bum'  );
    console.log( 's.t_person', s.t_person );
  })
});



describe( "fold" ,()=>{
  it ('as basic', ()=>{
    const s = schema.clone();
    const v = s.fold(
      s.object({
        foo: s.string(),
        bar: s.number(),
        baz: s.boolean(),
      })
    );
    assert.equal(true,
      v([
        {
          foo:'hello',
        },
        {
          bar: 78,
        },
        {
          baz: false,
        },
      ]
      )
    );
  });

  it ('as fold', ()=>{
    const s = schema.clone();
    const v = s.fold(
      s.object({
        foo: s.string(),
      })
    );
    assert.equal(true,
      v([
        {
          foo: 78,
        },
        {
          foo:'hello',
        },
      ]
      )
    );
    assert.equal(false,
      v([
        {
          foo:'hello',
        },
        {
          foo: 78,
        },
      ]
      )
    );
  });

  it ('as fold_right', ()=>{
    const s = schema.clone();
    const v = s.fold_right(
      s.object({
        foo: s.string(),
      })
    );
    assert.equal(false,
      v([
        {
          foo: 78,
        },
        {
          foo:'hello',
        },
      ]
      )
    );
    assert.equal(true,
      v([
        {
          foo: 'hello',
        },
        {
          foo: 78,
        },
      ]
      )
    );
  });
});



describe( "defined" ,()=>{
  it ('as 1', ()=>{
    const o = {
      foo : undefined,
    };
    const s = schema.clone();
    const v = s.object({
      foo : s.defined( s.any() ),
      bar : s.defined( s.any() ),
    });
    v(o);

    assert.equal( 'foo' in o , true );
    assert.equal( 'bar' in o , true );
    assert.equal( 'baz' in o , false );

  });
});




describe( "comment" ,()=>{
  it ('as 1', ()=>{
    const s = schema.clone();
    s.BEGIN_MODULE('hello');
    s.define`
      col dre
      /*
       * HELLO WORLD
       * HELLO WORLD  !@#$%^&*()
       * HELLO WORLD
       * HELLO WORLD
       * HELLO WORLD
       */
      t_color : or(
        equals( << "red" >>),
        equals( << "blue"  >>),
        equals( << "yellow" >>),
      ),

      foo
      bar
      t_person : object(
        name   : string(),
        age    : number(),
        attrs : object(
          favorite_color : or(
            t_color(),
            null(),
          ),
        ),
      ),
    `;
    s.END_MODULE();

    assert.equal( s.t_color.validator_comment ,
`HELLO WORLD
HELLO WORLD  !@#$%^&*()
HELLO WORLD
HELLO WORLD
HELLO WORLD`.trim() );

    console.log( "validator_comment",    s.t_color.validator_comment );
    console.log( "validator_annotations",s.t_color.validator_annotations );
    console.log( "validator_annotations",s.t_person.validator_annotations );
    console.log( "validator_annotations",s.t_person().validator_annotations );

  });
});


/**
 * Begin ChatGPT Generated Code
 * 2026/04/05 15:32:54
 * Sun, 05 Apr 2026 15:33:24 +0900
 */

describe( "validator hook trace context" ,()=>{
  it( 'as predefined validator in object', ()=>{
    const s = schema.clone();
    s.define`
      t_color : or(
        equals( << "red" >>),
        equals( << "blue" >>),
        equals( << "yellow" >>),
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
      )
    `;

    const trace = trace_validator( s.t_person(), {
      name : 'hello',
      age : 10,
      attrs : {
        favorite_color : 'green',
      },
    }).trace();

    assert.equal( /favorite_color:or/.test( trace ), true );
    assert.equal( /0:t_color/.test( trace ), true );
    assert.equal( /0:equals/.test( trace ), true );
  });

  it( 'as predefined validator in nargs', ()=>{
    const s = schema.clone();
    s.define`
      t_color : or(
        equals( << "red" >>),
        equals( << "blue" >>),
        equals( << "yellow" >>),
      ),
      t_set_color : nargs(
        favorite_color : t_color(),
      )
    `;

    const trace = trace_validator( s.t_set_color(), [
      {
        favorite_color : 'green',
      },
    ]).trace();

    assert.equal( /favorite_color:t_color/.test( trace ), true );
    assert.equal( /0:equals/.test( trace ), true );
  });

  it( 'as defined hook forwards context to sub validator', ()=>{
    const s = schema.clone();
    s.define`
      t_color : or(
        equals( << "red" >>),
        equals( << "blue" >>),
        equals( << "yellow" >>),
      ),
      t_person : object(
        favorite_color : defined(
          t_color()
        ),
      )
    `;

    const trace = trace_validator( s.t_person(), {
      favorite_color : 'green',
    }).trace();

    assert.equal( /favorite_color:defined/.test( trace ), true );
    assert.equal( /op:or/.test( trace ), true );
    assert.equal( /0:equals/.test( trace ), true );
  });
});


/**
 * End ChatGPT Generated Code
 * 2026/04/05 15:32:54
 * Sun, 05 Apr 2026 15:33:24 +0900
 */




