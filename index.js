const DEBUG = false;
const module_name = "vanilla-schema-validator";
const INFO = Symbol.for( 'dump schema information' );

const SCHEMA_VALIDATOR_COMPILE         = "vanilla-schema-validator.standard.compile";
const SCHEMA_VALIDATOR_DEFINE          = "vanilla-schema-validator.standard.define";
const SCHEMA_VALIDATOR_CURRENT_COMPILE = "vanilla-schema-validator.compile";
const SCHEMA_VALIDATOR_CURRENT_DEFINE  = "vanilla-schema-validator.define";

const SCHEMA_VALIDATOR_FACTORY_NAME   = 'factory_name' ;
const SCHEMA_VALIDATOR_COMMAND        = 'validator_command';
const SCHEMA_VALIDATOR_NAME           = 'validator_name';
const SCHEMA_VALIDATOR_RAW_SOURCE     = 'validator_raw_source' ;
const SCHEMA_VALIDATOR_SOURCE         = 'validator_source' ;
const SCHEMA_VALIDATOR_SOURCE_FOR_DOC = 'validator_source_for_doc' ;
const SCHEMA_VALIDATOR_COMMENT        = 'validator_comment' ;
const SCHEMA_VALIDATOR_COMMENT_SOURCE = 'validator_comment_source' ;
const SCHEMA_VALIDATOR_ANONYMOUS_TYPE = '__t_anonymous';
const SCHEMA_VALIDATOR_DEFAULT_TYPE   = '__t_default';
const SCHEMA_VALIDATOR_ANNOTATIONS    = 'validator_annotations';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name
// This is the property name of `Function.name` property.
const FUNCTION_NAME = 'name';

const INDENTATION_LEVEL = 10;
const INDENTATION_STR = ' '.repeat( INDENTATION_LEVEL );

/*
 * ADDED ON (Tue, 02 Apr 2024 16:12:59 +0900)
 */

const VANILLA_SCHEMA_VALIDATOR_MODULE_DATA_ID    = 'vanilla-schema-validator.definition_data ';
const VANILLA_SCHEMA_VALIDATOR_MODULE_TYPE_ID    = 'vanilla-schema-validator.definition_flag ';
const VANILLA_SCHEMA_VALIDATOR_MODULE_VISITOR_ID = 'vanilla-schema-validator.definition_flag ';
const VANILLA_SCHEMA_VALIDATOR_CURRENT_MODULE    = Symbol.for( VANILLA_SCHEMA_VALIDATOR_MODULE_DATA_ID    );
const VANILLA_SCHEMA_VALIDATOR_IS_MODULE         = Symbol.for( VANILLA_SCHEMA_VALIDATOR_MODULE_TYPE_ID    );
const VANILLA_SCHEMA_VALIDATOR_MODULES           = Symbol.for( 'vanilla-schema-validator.modules' );
const VANILLA_SCHEMA_VALIDATOR_MODULE_VISITOR    = Symbol.for( VANILLA_SCHEMA_VALIDATOR_MODULE_VISITOR_ID );


// const VANILLA_SCHEMA_VALIDATOR_HOOK       = Symbol.for( 'VANILLA_SCHEMA_VALIDATOR_HOOK' );
const VANILLA_SCHEMA_VALIDATOR_HOOK       = 'VANILLA_SCHEMA_VALIDATOR_HOOK' ;

/*
 * ADDED ON (Tue, 26 Dec 2023 15:39:16 +0900)
 */
const fold_nargs = (args)=>Object({}, ...(args.toReversed()));

/*
 * (Thu, 16 Feb 2023 18:54:50 +0900)
 *
 * When a factory names a validator , the name should be taken as both a
 * facotry name and as a validator name. And the factory name is immutable so
 * that it cannot be modified. When a user renames a validator, it only changes
 * its validator name and its validator factory name will not be changed.
 */
const name_validator   = (factory_name,validator)=>{

  Object.defineProperties( validator, {
    [SCHEMA_VALIDATOR_FACTORY_NAME]: {
      value : factory_name,
      enumerable : true,
      writable : true,
      configurable : true,
    },
    [SCHEMA_VALIDATOR_NAME]: {
      value : factory_name,
      enumerable : true,
      writable : true,
      configurable : true,
    },
  });


  return validator;
};


const DEFAULT_VALIDATOR_HOOK = (c,o,k,v)=>v(o[k],c);
/*
 * c : context
 * o : object
 * k : key
 * v : validator
 * const validator_hook = (c, o, k, v)=>{
 *  return v(o[k],c);
 * }
 */
const set_validator_hook = ( validator, validator_hook )=>{
  if ( validator_hook ) {
    Object.defineProperties( validator, {
      [VANILLA_SCHEMA_VALIDATOR_HOOK]: {
        value : validator_hook,
        enumerable : true,
        writable : true,
        configurable : true,
      },
    });
  }
  return validator;
};

const get_validator_hook = ( validator )=>{
  if ( VANILLA_SCHEMA_VALIDATOR_HOOK in validator ) {
    return validator[ VANILLA_SCHEMA_VALIDATOR_HOOK ];
  } else {
    return DEFAULT_VALIDATOR_HOOK;
  }
};




const get_validator_factory_name = (vlidator)=>{
  if ( SCHEMA_VALIDATOR_NAME in validator ) {
    return validator[ SCHEMA_VALIDATOR_NAME ];
  } else {
    return null;
  }
};

const path_to_str = (p,show_value)=>{
  if ( show_value ) {
    return `->{${p.id}:${vali_to_str(p.validator)}} === ${bool_to_str(p.value)}`;
  } else {
    return `->{${p.id}:${vali_to_str(p.validator)}}`;
  }
};
const vali_to_str = (v)=>{
  if ( SCHEMA_VALIDATOR_NAME in v ) {
    return v[SCHEMA_VALIDATOR_NAME];
  } else if ( 'name' in v ) {
    return v.name;
  } else {
    return '?';
  }
};

const bool_to_str = (v)=>{
  if ( v === null ) {
    return '0';
  } else if ( v ) {
    return 't';
  } else {
    return 'f';
  }
};


/*
 * SchemaValidatorContext : object(
 *   // this stores the current path elements
 *   path_stack : array_of(
 *     object(
 *       id : string(),
 *       validator : function(),
 *       value : boolean(),
 *     )
 *   ),
 *
 *   // this stores these snapshots of `path_stack`
 *   // which are created when `notify()` is called.
 *   notified_values : array_of(
 *     1t_path_stack(),
 *   ),
 *
 *   // the final result
 *   value : or( null(), boolean() ),
 * ),
 */
class SchemaValidatorContext {
  constructor({validator,target_value}) {
    this.path_stack = [];
    this.notified_values = [];
    this.validator = validator;
    /*
     * It is necessary to unprevent-undefined() before our trace() function
     * examines the given value; it will cause an error when the value is
     * passed to inspect() function which is actually a delegator function of
     * JSON.stringify().
     */
    this.target_value = unprevent( target_value );
    this.value = null;
  }
  enter( id, validator ) {
    this.path_stack.push({
      id,
      validator,
      value : null,
    });
  }
  notify( value ) {
    if ( typeof value !== 'boolean' ) {
      throw new TypeError( `notified an invalid value : ${value}` );
    }
    if ( this.path_stack.length < 1 ) {
      throw new RangeError( `stack undeflow error` );
    }
    const path_elem = this.path_stack[ this.path_stack.length -1 ];
    if ( path_elem.value !== null ) {
      throw new RangeError( `error: notify() has already been called` );
    }
    path_elem.value = value;
    this.notified_values.push( [ ...(this.path_stack) ] );
    this.value = value;
    return value;
  }
  leave() {
    return this.path_stack.pop();
  }
  trace() {
    return this.notified_values.map( e=>( e.map( (ee,idx,arr)=>'  ' + path_to_str(ee,arr.length-1===idx) ).join('') ) ).join('\n');
  }
  report() {
    const target_value_string     = inspect( this.target_value );
    const validator_source_string = change_indentation( this.validator.validator_source , 2 );
    const trace_string            = this.trace();

    if ( this.value ) {
      return (
        'the value (\n' +
        target_value_string +
        "\n) conforms to the type (\n" +
        validator_source_string +
        + "\n)" +
        trace_string
      );
    } else {
      return (
        'the value (\n' +
        target_value_string +
        "\n) does not conform to the type (\n" +
        validator_source_string +
        "\n)" +
        trace_string
      );
    }
  }
  toString() {
    return this.report();
  }
  [Symbol.for('nodejs.util.inspect.custom')](depth, inspectOptions, inspect) {
    return `\n${this.report()}`;
  }
}

class NullSchemaValidatorContext {
  enter(){}
  notify(value){ return value;}
  leave(){}
  result() { return [] }
  toString() { return '' }
};
const null_context = new NullSchemaValidatorContext();

const trace_validator = ( validator, target_value )=>{
  const context = new SchemaValidatorContext({validator,target_value});
  try {
    context.enter( 'begin', validator );
    const result = context.notify( validator( target_value, context ) );
    return context;
  } finally {
    context.leave();
  }
};

class TypeCastError extends TypeError {
  constructor(...args){
    super(...args);
  }
}

const typecast = ( validator, target_value )=>{
  const context = trace_validator( validator, target_value );
  if ( ! context.value ) {
    throw new TypeCastError( context.report() );
  }
  return target_value;
};

const typeassert = (...args)=>{
  try {
    return typecast( ...args );
  } catch ( e ){
    console.error( e );
  }
};

function vali_to_string( vali ) {
  if ( typeof vali !== 'function' ) {
    throw new TypeError( 'vali is not a function' );
  }

  try {
    const result = vali( INFO );
    if ( typeof result !== 'boolean' ) {
      return result;
    }
  } catch (e) {
    console.error(e);
    // safely ignorable
  }

  if ( 'source' in vali ) {
    return vali.source;
  } else if ( 'script' in vali ) {
    return vali.script;
  } else {
    return Function.prototype.toString.call( vali );
  }
}

const check_if_proper_vali = func=>{
  if ( func === null ) {
    return 'null';
  } else if ( func === undefined ) {
    return 'undefined';
  } else if ( typeof func !== `function` ) {
    return 'not a function';
  } else {
    const result = func( false );
    if ( typeof result === 'function' ) {
      return 'a validator that returns a function not a boolean; probably you forgot to call your validator factory.';
    } else if ( typeof result !== 'boolean' ) {
      return 'a validator returned neither a boolean nor a function';
    }
  }
  return null;
};


/*
 * example)
 *
 * object(
 *   name : string(),
 *   age  : number(),
 *   field : or( number(), string() ),
 *   attrs : object(
 *     foo: string(),
 *     bar: number(),
 *   )
 * )
 *
 * id        = [a-zA-Z0-9]+
 * validator = id
 * factory   = id( PARAMS )
 * valifac   =  ( validator-name : ) factory
 * PARAMS    = valifac ( , PARAMS )
 *
 * schema    = valifac
 *
 */
const join_strings_and_values = ( strings, values )=>strings.map((s,i)=>(s + ((i in values ) ? values[i] : '' ) )  ).join('');

const create_static_value_interpolator_id = (c)=>'t__static_value_' + ( c ) + '_interpolator';
const create_regexp_static_value_interpolator = ()=>/\bt__static_value_([0-9]+)_interpolator\b\(\)/gm;


function __parse(input) {
  class CompileError extends Error {
    constructor(...args) {
      const arg = Object.assign({},...args);
      super(args.message, args);
      Object.assign( this, arg );
    }
  }
  const escaped_blocks = [];
  const add_escaped_block = ({value,match,as_clousure})=>{
    /*
     * value   : a value on the compiled source code.
     * match : a value on the source code on the documentation.
     */
    const c = escaped_blocks.length;
    const key = create_static_value_interpolator_id( c );
    escaped_blocks.push({ key, value, match, as_clousure });
    return key + '()';
  };



  function escape_blocks( s ) {
    return s.replaceAll( /<<(.*?)>>/g, function(match,p1) {
      return add_escaped_block({value:p1,match, as_clousure : true });
    });
  }

  function escape_line_comment( s ) {
    return s.replaceAll( /\/\/.*$/gm, function (match) {
      return add_escaped_block({ value:'', match: '//' +match, as_clousure : false});
    });
  }
  function remove_line_comment( s ) {
    return s.replaceAll( /\/\/.*$/gm, function (match) {
      return ' ';
    });
  }

  function escape_block_comment( s ) {
    return s.replaceAll( /\/\*[\s\S]*\*\//gm,
      function (match) {
        return add_escaped_block({value:'',match, as_clousure : false });
      }
    );
  }
  function remove_block_comment( s ) {
    return s.replaceAll( /\/\*[\s\S]*\*\//gm,
      function (match) {
        return ' ';
      }
    );
  }

  function check_all_valid_chars( s ) {
    const regexp = /[^\$a-zA-Z0-9_:,\(\)\*\/\s]/gm;
    return s.replaceAll(regexp , function (match,offset,string,groups) {
      throw new CompileError({message: `invalid character '${ match }' in character ${ offset }\n${s}` });
    });
  }

  // const modified_input =
  //   check_all_valid_chars(
  //     remove_line_comment(
  //       remove_block_comment(
  //         escape_blocks( input  ))));

  // console.log( '**************************',new Date() );

  const modified_input =
      remove_line_comment(
          escape_blocks( input  ));


  ///

  const KWD = '@'; // t_validator_type
  const BGN = '('; // (
  const END = ')'; // )
  const PSP = ','; // , ... comma / parameter separator
  const KSP = ';'; // ; ... colon / key-value separator
  const CBB = '/*'; // /*
  const CBE = '*/'; // */
  const SPC = ' ';

  class Token {
    constructor({type,value,src}) {
      if ( type === null || type === undefined ) {
        throw new ReferenceError( 'type was not specified' );
      }
      if ( value === null || value === undefined ) {
        throw new ReferenceError( 'value was not specified' );
      }
      if ( typeof type  !== 'string' ) {
        throw new TypeError( 'invalid type of `type`' );
      }
      if ( typeof value  !== 'string' ) {
        throw new TypeError( 'invalid type of `value`' );
      }
      this.type = type;
      this.value = value;
      this.src = src;
    }
  }

  ////                  2                  3     4     5     6     7      8
  //// const pattern = /(([0-9a-zA-Z\$_]+)|([(])|([)])|([,])|([:])|(\/\*)|(\*\/))/g;
  //
  //                2     3     4     5     6     7        8    9
  const pattern = /(([(])|([)])|([,])|([:])|(\/\*)|(\*\/)|(\s+)|([^,:()\s]+))/g;
  const tokens = [];
  for(;;) {
    const m = pattern.exec( modified_input );
    if ( ! m ) {
      break;
    }
    if ( false ) {
    } else if ( typeof m[2] === 'string' ) {
      tokens.push( new Token({
        type : BGN,
        value : m[2],
        src :{
          input : m.input,
          position: m.index,
        },
      }));
    } else if ( typeof m[3] === 'string' ) {
      tokens.push( new Token({
        type : END,
        value : m[3],
        src :{
          input : m.input,
          position: m.index,
        },
      }));
    } else if ( typeof m[4] === 'string' ) {
      tokens.push( new Token({
        type : PSP,
        value : m[4],
        src :{
          input : m.input,
          position: m.index,
        },
      }));
    } else if ( typeof m[5] === 'string' ) {
      tokens.push( new Token({
        type : KSP,
        value : m[5],
        src :{
          input : m.input,
          position: m.index,
        },
      }));
    } else if ( typeof m[6] === 'string' ) {
      tokens.push( new Token({
        type : CBB,
        value : m[6],
        src :{
          input : m.input,
          position: m.index,
        },
      }));
    } else if ( typeof m[7] === 'string' ) {
      tokens.push( new Token({
        type : CBE,
        value : m[7],
        src :{
          input : m.input,
          position: m.index,
        },
      }));
    } else if ( typeof m[8] === 'string' ) {
      tokens.push( new Token({
        type : SPC,
        value : m[8],
        src :{
          input : m.input,
          position: m.index,
        },
      }));
    } else if ( typeof m[9] === 'string' ) {
      tokens.push( new Token({
        type : KWD,
        value : m[9],
        src :{
          input : m.input,
          position: m.index,
        },
      }));
    } else {
      throw new CompileError({message:'internal error ' + input });
    }
  }

  class Elem {
    constructor(token) {
      this.token  = token;
      this.token_at_begining = token;
      this.token_at_end = null;
      this.left_id = null;  // this was called as `vali_id` formerly.
      this.right_id = null; // this was called as  `fac_id` previously.
      this.children = [];
      this.is_closed_element = false;
      this.is_annotation = false;
      this.comment_content = null;
    }
    range() {
      // const leading_s =               this.comment_block?.token_at_begining ?.src?.position  ?? null;
      const leading_s = null;
      const s         = leading_s ?? (this.               token_at_begining ?.src?.position) ?? null;
      const e         =               this.               token_at_end      ?.src?.position  ?? null;
      if ( s !== null && e !== null ) {
        return [s,e];
      } else {
        return null;
      }
    }
    source() {
      const r = this.range();
      if ( r ) {
        return this.token?.src?.input.substring( r[0], r[1] +1 ) ?? null;
      }
    }
  }

  {
    let mode = 'normal'; // 'normal' or 'inside_comment_block'
    let elem_stack = [ new Elem(null) ];
    let work_elem = null;

    let current_comment_block   = null;
    let last_comment_block = null;

    const notify_beginning_of_elem = (work_elem,current_token)=>{
      if ( work_elem !== null ) {
        work_elem.token_at_begining = current_token;
      }
    };
    /*
     * Notify the end of the current element.
     * There are two posibillities that ends the current element :
     *   1. an end of a pair of parenthesis
     *   2. a parameter separator  ( comma )
     * See the code bellow.
     */
    const notify_end_of_elem = (work_elem,current_token)=>{
      if ( work_elem !== null ) {
        work_elem.token_at_end = current_token;
      }
    };

    const notify_begin_of_elem = ( current_token )=>{
      // begin a new definition
      work_elem = new Elem( current_token );
      elem_stack[ elem_stack.length-1 ].children.push( work_elem );
      if ( last_comment_block ) {
        work_elem.comment_block = last_comment_block;
        last_comment_block = null;
      }
    };

    for ( const current_token of tokens ) {

      switch ( mode ) {
        /*
         * <<< THE BEGINNING OF NORMAL MODE
         */
        case 'normal' : {
          switch ( current_token.type ) {
            case KWD : {

              if ( work_elem === null ) {
                notify_begin_of_elem( current_token );
              }

              /*
               * Process annotations
               */
              if ( work_elem.right_id !== null ) {
                if ( work_elem.left_id === null ) {
                  // MODIFIED (Tue, 19 Mar 2024 18:39:51 +0900)
                  // throw new CompileError({message: 'missing colon' });

                  // Notify the end of the current element.
                  notify_end_of_elem( work_elem, current_token );
                  work_elem.is_annotation = true; // ADDED ON Tue, 19 Mar 2024 20:17:00 +0900
                  work_elem = null;
                  notify_begin_of_elem( current_token );
                } else {
                  throw new CompileError({message: 'missing comma' });
                }
              }

              notify_beginning_of_elem( work_elem, current_token );

              work_elem.right_id = current_token.value;

              break;
            };
            case SPC : {
              // IGNORE

              break;
            };
            case BGN : {
              if ( work_elem === null ) {
                throw new CompileError({message: 'expected a keyword but missing' });
              }
              if ( work_elem.is_closed_element !== false ) {
                throw new CompileError({message: `expected ')' or a new keyword but missing` });
              }
              elem_stack.push( work_elem );
              work_elem = null;

              break;
            };

            case END : {
              if ( work_elem === null ) {
                // This can be safely ignored.
                // throw new CompileError({message: 'expected a keyword but missing' });
              }
              if ( elem_stack.length <= 0 ) {
                throw new CompileError({message: 'an unmatched parenthes' });
              }

              notify_end_of_elem( work_elem, current_token );

              work_elem = elem_stack.pop();
              work_elem.is_closed_element = true;

              break;
            };

            case PSP : {
              if( work_elem === null ) {
                throw new CompileError({message: 'missing keyword' });
              }

              // Notify the end of the current element.
              notify_end_of_elem( work_elem, current_token );

              work_elem = null;

              break;
            };

            case KSP : {
              if ( work_elem === null ) {
                console.error( current_token, tokens );
                throw new CompileError({message: 'no validator was specified' });
              }
              if ( work_elem.right_id === null ) {
                throw new CompileError({message: 'no factory was specified' });
              }
              if ( work_elem.left_id !== null ) {
                throw new CompileError({message: 'duplicate colon error' });
              }
              work_elem.left_id = work_elem.right_id;
              work_elem.right_id = null;

              break;
            };

            case CBB : {
              // entering to comment block mode
              mode = 'inside_comment_block';

              /*
               * if current_comment_block is already exists, keep it; this
               * process eventually causes multiple comment blocks to be
               * concatenated. (Tue, 28 May 2024 19:35:07 +0900)
               */
              if ( ! current_comment_block ) {
                current_comment_block = {
                  comment_content : '',
                  token_at_begining : current_token,
                  token_at_end : null,
                };
              }
              break;
            };

            default : {
              throw new CompileError({message: 'internal error ' + input });
            };
          };

          break;
        };
        /*
         * >>> END OF NORMAL MODE
         */

        /*
         * <<< BEGINNING OF COMMENT BLOCK MODE
         */
        case 'inside_comment_block' : {
          switch ( current_token.type ) {
            case CBE : {
              // back to normal
              mode = 'normal';

              current_comment_block.token_at_end = current_token;
              last_comment_block = current_comment_block;
              current_comment_block = null;
              if (DEBUG){
                console.log({ last_comment_block });
              }
              break;
            };
            default : {
              // if ( current_comment_block.comment_content !== '' ) {
              //   current_comment_block.comment_content += ' ';
              // }
              current_comment_block.comment_content += current_token.value;
              break;
            };
          }
          break;
        };
        /*
         * >>> END OF COMMENT BLOCK MODE
         */

        default : {
          throw new CompileError({message: 'internal error ' + input });
        };
      };
    }
    notify_end_of_elem( work_elem, 0<tokens.length ? tokens[ tokens.length -1 ] : null );

    if (  elem_stack.length !== 1 ) {
      throw new CompileError({ message:'probably found an unmatched parenthesis' });
    }

    const parsed = {
      source : input,
      tokens,
      modified_source : modified_input,
      definitions : [...elem_stack.shift().children ],
      escaped_blocks,
    };

    return parsed;
  }
}

function escape_backticks( source ) {
  if ( typeof source !== 'string' ) {
    console.error ({source});
    throw new Error( 'an invalid type of the specified value' );
  }
  return '\u0060' + source.replaceAll( /[\u0060]/gm, '\\\u0060' ) + '\u0060';
}

function remove_leading_asterisks(s) {
  return s.replace( /^\s*\* ?/gm, (m)=>'' ).trim();
}

function minimum_indentation(s){
  if ( typeof s !== 'string' ) {
    throw new TypeError();
  }
  const lines = s.split( '\n' );
  let min = Number.MAX_VALUE;
  for ( const line of lines ) {
    const matched = /^(\s+)/g.exec( line );
    if ( matched ) {
      const [p,p0] = matched;
      // console.log( 'log', `"${p0}"` );
      if ( p0.length < min ) {
        min = p0.length;
      }
    }
  }
  if ( min === Number.MAX_VALUE ) {
    return 0;
  } else {
    return min;
  }
}

function normalize_indentation( s, length, replacer ) {
  if ( typeof s !== 'string' ) {
    throw new Error( 's is not a string' );
  }
  if ( typeof length !== 'number' ) {
    throw new Error( 'length is not a number' );
  }
  if ( typeof replacer !== 'string' ) {
    throw new Error( 'replacer is not a number' );
  }
  const search_string = ' '.repeat( length );
  const lines = s.split( '\n' );
  for ( let i=0; i<lines.length; i++ ) {
    const line = lines[i];
    let new_line;
    if ( line === '' ) {
      new_line = replacer;
    } else if ( /^\S+$/.exec( line ) ) {
      new_line = replacer + lines[i];
    } else {
      new_line = line.replace( new RegExp( '^' + search_string ), replacer );
    }
    // console.log( 'lines', i, line, new_line );
    lines[i] = new_line;
  }
  return lines.join( '\n' );
}

/*
 * You have to trim the input string.
 * const s = `
 *     foo
 *     bar
 *     bum
 *  `;
 * Such case is very common.
 */

function change_indentation( source, level ) {
  source = '\n' + source.trim() + '\n';
  return normalize_indentation( source, minimum_indentation( source ), ' '.repeat(level) );
}


function get_source( parsed, elem ) {
  let source = elem.source();
  source = source.replace( create_regexp_static_value_interpolator() , (match,p1)=>{
    const a_escaped_block = parsed.escaped_blocks[ Number(p1) ];
    return a_escaped_block.match.trim() + ' ';
  });

  // source = source + 'hello';
  source = escape_backticks( source );

  source = normalize_indentation( source, minimum_indentation( source ), INDENTATION_STR );

  return source;
}


/*
 * ADDED ON (Tue, 02 Apr 2024 16:12:59 +0900)
 */
function get_validator_command_function(parsed,elem) {
  /*
   * Please, be aware of the bind-calling : `bind(this)`
   * This enables every validator_factory that was generated by the compiler
   * would be bound to a specific schema object.
   */
  return (`
            (function (nargs) {
              return this.VISIT_MODULE({
                ...nargs,
                validator_factory,
              })
            }).bind( self )
          `);
}


function get_validator_source_function(parsed,elem) {
  /*
   * Please, be aware of the bind-calling : `bind(this)`
   * This enables every validator_factory that was generated by the compiler
   * would be bound to a specific schema object.
   */
  return (`
            (function (nargs) {
              if ( this?.${SCHEMA_VALIDATOR_NAME} === '${SCHEMA_VALIDATOR_ANONYMOUS_TYPE}' ) {
                return (
                    "${INDENTATION_STR}"
                  + this?.${SCHEMA_VALIDATOR_RAW_SOURCE} ?? ""
                )
              } else {
                return (
                    "${INDENTATION_STR}"
                  + ( this?.${SCHEMA_VALIDATOR_NAME} ?? "" )
                  + ":"
                  + ( this?.${SCHEMA_VALIDATOR_RAW_SOURCE} ?? "")
                );
              }
            })
          `);
}


function get_validator_source_function_for_doc(parsed,elem) {
  /*
   * Please, be aware of the bind-calling : `bind(this)`
   * This enables every validator_factory that was generated by the compiler
   * would be bound to a specific schema object.
   */

  // FIXME THIS CAN BE SIMPLIFIED
  return (`
            (function (nargs) {
              if ( this?.${SCHEMA_VALIDATOR_NAME} === '${SCHEMA_VALIDATOR_ANONYMOUS_TYPE}' ) {
                return (
                    "${INDENTATION_STR}"
                  + this?.${SCHEMA_VALIDATOR_RAW_SOURCE} ?? ""
                )
              } else {
                return (
                    ""
                  + ( this?.${SCHEMA_VALIDATOR_COMMENT_SOURCE} ? "${INDENTATION_STR}" : "" )
                  + ( this?.${SCHEMA_VALIDATOR_COMMENT_SOURCE} ?? "" )
                  + "${INDENTATION_STR}"
                  + ( this?.${SCHEMA_VALIDATOR_NAME} ?? "" )
                  + ":"
                  + ( this?.${SCHEMA_VALIDATOR_RAW_SOURCE} ?? "")
                );
              }
            })
          `);
}

function normalize_comment_content( source ) {
  source = normalize_indentation( source, minimum_indentation( source ), INDENTATION_STR );
  return source;
}

function get_validator_comment(parsed,elem,do_remove_leading_asterisks) {
  if ( elem?.comment_block ) {
    const __comment_content = elem.comment_block.comment_content;
    const comment_content = do_remove_leading_asterisks ?
                              remove_leading_asterisks( __comment_content ) :
                                                      '/*' +normalize_comment_content( __comment_content ) + '*/\n';
    const escaped_comment_content = escape_backticks( comment_content );

    if ( DEBUG ) {
      console.log( comment_content );
    }

    return (`
            function validator_comment() {
              return (
                ${escaped_comment_content}
              )
            }`);
  } else {
    return (`function validator_comment() { return null } ` );
  }
}




function get_config_function2() {
  return (`
            (nargs)=>{
              const {
                command,
                value,
              } = nargs;
              switch (command) {
                case 'name':
                  Object.defineProperties( validator_factory, {
                    'name' : {
                      value : value,
                      enumerable   : false,
                      writable     : false,
                      configurable : true,
                    },
                  });
                  return validator_factory;
                case 'self':
                  return validator_factory;
                default :
                  return undefined;
              }
              return validator_factory
            }`);
}

function is_named_args( elem ) {
  return elem.right_id === 'object' || elem.right_id === 'nargs';
}

function __compile( parsed ) {
  const compiled_buf = [];
  const output = (...args)=>compiled_buf.push(...args);
  const remove_last_comma = ()=>{
    const i = compiled_buf.length -1;
    compiled_buf[ i ] = compiled_buf[ i ].replaceAll( /,\s*$/gm ,'' );
  }

  output( '"use strict";' );
  output( 'const self=this;' );
  const check_escaped_block = (s)=>{
    s=s.trim();
    if ( s.trim() === '' ) {
      return 'undefined';
    } else {
      return s;
    }
  };

  for ( const {key,value,as_clousure} of parsed.escaped_blocks ) {
    if ( as_clousure ) {
      output( `const ${key} = ()=>(${check_escaped_block(value)});` );
    }
  }

  function output_elem( parent_elem, elem, indent_level ) {
    const indent  = " ".repeat( (indent_level + 4 ) * 2 );
    const {
      paren_b,
      paren_e
    } = is_named_args( elem ) ? {
      paren_b : '{',
      paren_e : '}',
    } : {
      paren_b : '',
      paren_e : '',
    };

    const schema_name = elem.right_id.match( /^t__static_value_[0-9]+_interpolator$/ ) ? '' : 'schema.';

    // Omit to output validator id on the first indent level.  The first indent
    // level should be treated specially because  it should be enclosed by a
    // function call. If it is without the enclosing, it would be implemented
    // symmetrically.
    if ( indent_level === 0 ) {
      output( indent +                                        `${schema_name}${elem.right_id}(${paren_b}` );
    } else {
      // >>> MODIFIED ON (Sat, 03 Jun 2023 14:35:24 +0900)
      // >>> omit output left_id when the parent factory id is not an object.
      const tmp_val_id = is_named_args( parent_elem ) ? elem.left_id : null;
      output( indent + `${tmp_val_id ? tmp_val_id +':' : '' }${schema_name}${elem.right_id}(${paren_b}` );
      // <<< MODIFIED ON (Sat, 03 Jun 2023 14:35:24 +0900)
    }
    for ( const sub_elem of elem.children ) {
      output_elem( elem, sub_elem, indent_level + 1 );
    }
    // if ( elem.children.length === 0 ) {
    //   output( '// YO ' + elem.right_id );
    // }
    remove_last_comma();
    output( indent + `${paren_e}),` );
  }

  const annotations_elem_stack = [];

  output( 'const result = ({' );
  let type_name = null;
  for ( const elem of parsed.definitions ) {
    if ( elem.is_annotation ) {
      annotations_elem_stack.push( elem );
      continue;
    }
    const is_anonymous = ! elem.left_id;
    type_name = is_anonymous ? SCHEMA_VALIDATOR_ANONYMOUS_TYPE : elem.left_id;
    const validator_source_text = get_source(parsed, elem);

    output( `  "${type_name}" : (()=>{`);
    output( `    const validator_factory = function ${type_name}(...args) {` );
    output( `    const schema = this === undefined ? self : this;` );
    output( `    try {` );
    output( `      const validator = schema.thru(` );

    output_elem( null, elem, 0 );
    remove_last_comma();

    output( `      );` );
    output( `      Object.defineProperties(validator,{` );
    output( `        "${SCHEMA_VALIDATOR_NAME}" : {`);
    output( `          value : "${type_name}", `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_FACTORY_NAME}" : {` );
    output( `          value : "${type_name}", `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_RAW_SOURCE}" : {`);
    output( `          value : ${validator_source_text.trim()} , `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_SOURCE}" : {`);
    output( `          get: ${get_validator_source_function(parsed, elem)}, `);
    output( `          enumerable   : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_SOURCE_FOR_DOC}" : {`);
    output( `          get: ${get_validator_source_function_for_doc(parsed, elem)}, `);
    output( `          enumerable   : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `        "toString" : {`);
    output( `          value : ()=>this?.${SCHEMA_VALIDATOR_SOURCE_FOR_DOC} ?? "UNDEFINED(S)", `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_ANNOTATIONS}" : {`);
    output( `          value        : [ ${ annotations_elem_stack.map( elem=>'"'+elem.right_id + '"' ) } ],`);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_COMMENT}" : {`);
    output( `          get: ${get_validator_comment(parsed, elem,true)}, `);
    output( `          enumerable   : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_COMMENT_SOURCE}" : {`);
    output( `          get: ${get_validator_comment(parsed, elem,false)}, `);
    output( `          enumerable   : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `      });` );
    output( `      return validator;` );
    output( `    } catch ( e ) {` );
    output( `      e.source = ${type_name}.toString();` );
    output( `      e.schema = schema;` );
    output( `      throw e;` );
    output( `    }` );
    output( `    }` );
    output( `    Object.defineProperties( validator_factory,{` );
    output( `        "${SCHEMA_VALIDATOR_NAME}" : {`);
    output( `          value : "${type_name}", `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_COMMAND}" : {`);
    output( `          value : ${get_validator_command_function(parsed, elem)}, `); // this function will be bound(this).
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_RAW_SOURCE}" : {`);
    output( `          value : ${validator_source_text.trim()} , `);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_SOURCE}" : {`);
    output( `          get: ${get_validator_source_function(parsed, elem)}, `);
    output( `          enumerable   : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_SOURCE_FOR_DOC}" : {`);
    output( `          get: ${get_validator_source_function_for_doc(parsed, elem)}, `);
    output( `          enumerable   : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_ANNOTATIONS}" : {`);
    output( `          value        : [ ${ annotations_elem_stack.map( elem=>'"'+elem.right_id + '"' ) } ],`);
    output( `          enumerable   : false,   `);
    output( `          writable     : false,   `);
    output( `          configurable : true,    `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_COMMENT}" : {`);
    output( `          get: ${get_validator_comment(parsed, elem, true)}, `);
    output( `          enumerable   : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `        "${SCHEMA_VALIDATOR_COMMENT_SOURCE}" : {`);
    output( `          get: ${get_validator_comment(parsed, elem,false)}, `);
    output( `          enumerable   : false,   `);
    output( `          configurable : false,   `);
    output( `        },`);
    output( `    })` );
    output( `    return validator_factory;` );
    output( `    }` );
    output( `  )(),` );

    annotations_elem_stack.length = 0;
  }
  output('});' );
  if ( type_name !== null ) {
    output( `result.${SCHEMA_VALIDATOR_DEFAULT_TYPE} = result.${type_name};` );
  }
  output( `return result;` );

  const clean_source = (s)=>{

    /*
     * remove comment blocks from the compiled code
     */
    s = s.replace( create_regexp_static_value_interpolator() , (match,p1)=>{
      const a_escaped_block = parsed.escaped_blocks[ Number(p1) ];
      if ( ! a_escaped_block.as_clousure ) {
        return a_escaped_block.match.trim() + ' ';
        // return match;
      } else {
        return match;
      }
    });

    s = s.replaceAll( /\(\s*\)/gm, '()' );
    return s;
  };

  const compiled_source = clean_source( compiled_buf.join('\n')) ;
  let factory_factory = null;
  try {
    factory_factory = new Function( compiled_source );
    Object.defineProperties( factory_factory,{
      name: {
        value        : 'factory_factory',
        enumerable   : false,
        writable     : false,
        configurable : true,
      }
    });
  } catch (e){
    e.message += ' in\n---\n' + compiled_source.replaceAll( /^/gm, ' '.repeat(4) ) + '\n---\n';
    e.source = compiled_source;
    throw e;
  }
  return {
    ...parsed,
    compiled_buf,
    compiled_source,
    factory_factory,
  };
}

function schema_validator_script_compiler( input ) {
  const parsed   = __parse( input  );
  const compiled = __compile( parsed );
  return compiled;
}

function schema_validator_template_literal_compile( strings, ... values ) {
  if ( this === undefined )
    throw Error('this is undefined');
  if ( ! Array.isArray( strings ) ) {
    throw new TypeError( 'the first argument is not an array' );
  }
  if ( ! strings.every(e=>typeof e === 'string' ) )  {
    throw new TypeError( 'the array of the first argument contains a non-string value' );
  }

  const input = join_strings_and_values( strings, values );
  const compiled = schema_validator_script_compiler( input );
  try {
    const result   = compiled.factory_factory.call( this );

    // console.log( 'compiled_buf', compiled.compiled_buf.join('\n') );
    // console.log( 'decompiled',   result.${SCHEMA_VALIDATOR_DEFAULT_TYPE}.toString() );

    // notify_validator_factory
    result[SCHEMA_VALIDATOR_DEFAULT_TYPE][SCHEMA_VALIDATOR_COMMAND]({command:'notify_validator_factory'});

    return result[SCHEMA_VALIDATOR_DEFAULT_TYPE];
  } catch (e) {
    throw new Error( 'an error was occured when executing an internal function named `factory_factory`\n' + compiled.compiled_source, {cause:e});
  }
}

function schema_validator_template_literal_define( strings, ... values ) {
  if ( this === undefined )
    throw Error('this is undefined');
  if ( ! Array.isArray( strings ) ) {
    throw new TypeError( 'the first argument is not an array' );
  }
  if ( ! strings.every(e=>typeof e === 'string' ) )  {
    throw new TypeError( 'the array of the first argument contains a non-string value' );
  }

  const input = join_strings_and_values( strings, values );
  const compiled = schema_validator_script_compiler( input );

  try {
    const result   = compiled.factory_factory.call( this );
    for ( const [key,value] of Object.entries( result ) ) {
      if (DEBUG) {
        console.log( 'define', 'key',key , 'value', value );
      }
      if ( key === SCHEMA_VALIDATOR_DEFAULT_TYPE ) continue;
      const validator_factory = value;
      validator_factory[SCHEMA_VALIDATOR_COMMAND]({command:'notify_validator_factory'});
    }

    // console.log( 'compiled_buf', compiled.compiled_buf.join('\n') );
    Object.assign( this, result );
    return result;
  } catch (e) {
    throw new Error( 'an error was occured when executing an internal function named `factory_factory`\n' + compiled.compiled_source, {cause:e});
  }
}

function is_current_module_existed( schema ) {
  return schema?.[VANILLA_SCHEMA_VALIDATOR_CURRENT_MODULE]?.[VANILLA_SCHEMA_VALIDATOR_IS_MODULE] === true;
}
function set_current_module( schema , current_module ) {
  return schema[VANILLA_SCHEMA_VALIDATOR_CURRENT_MODULE]  = current_module;
}
function get_current_module( schema ) {
  return schema?.[VANILLA_SCHEMA_VALIDATOR_CURRENT_MODULE] ?? undefined;
}



function BEGIN_MODULE({ module_name =null, header=null, footer=null, output_filename, filename, dirname }) {
  if ( is_current_module_existed( this ) ) {
    throw new Error( 'a duplicate call of BEGIN_MODULE() was detected', get_current_module(this) );
  }
  set_current_module(this,{
    [VANILLA_SCHEMA_VALIDATOR_IS_MODULE] : true,
    filename,         // <<< this supporsed to be  from import.meta
    dirname,          // <<< this supporsed to be  from import.meta
    output_filename,  // << this can override
    module_name,
    header,
    footer,
    validator_list : [],
  });
}

function END_MODULE() {
  if ( ! is_current_module_existed( this ) ) {
    console.error( this );
    throw new Error( 'a missing call of BEGIN_MODULE() was detected' );
  }
  const current_module = get_current_module(this);
  set_current_module(this,null);

  if ( DEBUG ) {
    console.log( 'END_MODULE' );
  }
  // console.log( current_module.validator_list.map( (e,i)=>`${i}:\n${e?.[SCHEMA_VALIDATOR_SOURCE]}\n` ).join('\n') );
  // console.log( current_module.validator_list.map( (e,i)=>`${e?.[SCHEMA_VALIDATOR_SOURCE]}\n` ).join('\n') );
  // console.log( module_to_source( current_module ) );
  //
  this[VANILLA_SCHEMA_VALIDATOR_MODULES].push( current_module );
}


const set_validator_name = (validator_factory, validator_name)=>{
    Object.defineProperties( validator_factory, {
      [FUNCTION_NAME] : {
        value        :  validator_name,
        enumerable   : false,
        writable     : false,
        configurable : true,
      },
      [SCHEMA_VALIDATOR_NAME] : {
        value        :  validator_name,
        enumerable   : false,
        writable     : false,
        configurable : true,
      },
    });
};


/*
 * `this` would be a schema object.
 */
function VISIT_MODULE( nargs ) {
  const schema = this;
  if ( DEBUG ) {
    console.log( 'VISIT_MODULE', nargs );
  }
  const {
    command,
    type,
    value,
    validator_factory,
    description_object,
  } = nargs;

  const current_module = get_current_module( schema );
  const is_module_data_available = (()=>{
    if ( ! current_module ) {
      return false;
    }
    if ( current_module[VANILLA_SCHEMA_VALIDATOR_IS_MODULE] !== true  ) {
      throw new Error( 'it is prohibited to call the validator module methods to other than vanilla-schema-validator internal-objects.' );
    }
    return true;
  })();

  switch (command) {
    case 'notify_validator_factory': {
      /*
       * The `notify_validator_factory` command is a callback function which is
       * called when a validator factory is created. This callback function is
       * currently not used since the adding the current validator factory is
       * now duty of `notify_typesafety` command.
       *
       * (Fri, 31 May 2024 16:06:29 +0900)
       */
      if ( is_module_data_available ) {
        // <<< commented out (Fri, 31 May 2024 16:06:29 +0900)
        current_module.validator_list.push({ type: 'validator_factory' , value: validator_factory });
        // >>>
      }
      return value;
    };

    case 'notify_description': {
      switch ( type ) {
        case 'created' : {
          if ( is_module_data_available ) {

            current_module.validator_list.push({ type: 'description' , value: description_object });
          }
          break;
        };
      }
      return value;
    };

    case 'notify_typesafety' : {
      switch ( type ) {
        // case 'method' : {
        //   if ( is_module_data_available ) {
        //     current_module.validator_list.push({ type: 'description' , value: `
        //         ${value}
        //       -------------
        //     `.replace( /^\s*/gm,'') });
        //   }
        //   break;
        // };
        case 'description' : {
          description_object.bind_template_parameter( { method_name : value });
          break;
        };
        case 'input' : {
          if ( DEBUG ) {
            console.debug( 'WUHxGUtDSZnJcPxml', 'notify_typesafe_input' );
          }
          set_validator_name( validator_factory, `t_typesafety_input_of_${value}` );

          // /*
          //  * Add the current validator factory to the validator list.
          //  */
          // if ( is_module_data_available ) {
          //   current_module.validator_list.push({ type: 'validator_factory' , value: validator_factory });
          // }

          return validator_factory;

        };
        case 'output' : {
          if ( DEBUG ) {
            console.debug( 'WUHxGUtDSZnJcPxml', 'notify_typesafe_output' );
          }
          set_validator_name( validator_factory, `t_typesafety_output_of_${value}` );

          // /*
          //  * Add the current validator factory to the validator list.
          //  */
          // if ( is_module_data_available ) {
          //   current_module.validator_list.push({ type: 'validator_factory' , value: validator_factory });
          // e

          return validator_factory;
        };
        default : {
          throw new Error(`unknown type ${type}`);
        };
      }
      return validator_factory;
    };

    // case 'notify_typesafe_input':{
    //   if ( DEBUG ) {
    //     console.debug( 'WUHxGUtDSZnJcPxml', 'notify_typesafe_input' );
    //   }
    //   set_validator_name( validator_factory, `t_vtype_input_of_${value}` );
    //   return validator_factory;
    // };

    // case 'notify_typesafe_output': {
    //   if ( DEBUG ) {
    //     console.debug( 'WUHxGUtDSZnJcPxml', 'notify_typesafe_output' );
    //   }
    //   set_validator_name( validator_factory, `t_vtype_output_of_${value}` );
    //   return validator_factory;
    // };


    case 'name': {
      Object.defineProperties( validator_factory, {
        'name' : {
          value        : value,
          enumerable   : false,
          writable     : false,
          configurable : true,
        },
      });
      return validator_factory;
    };
    case 'self': {
      return validator_factory;
    };
    default : {
      return undefined;
    };
  }

  return validator_factory;
}

function notify_description(strings,...values) {
  const self = this;
  const __input = join_strings_and_values( strings, values );
  const input = change_indentation( __input , 0 );

  const description_object = {
    [SCHEMA_VALIDATOR_COMMAND] : (function validator_command(nargs) {
      self.VISIT_MODULE({
        ...nargs,
        description_object:this,
      })
    }),
    bind_template_parameter(nargs) {
      this.template_arguments = {
        ...this.template_arguments,
        ...nargs,
      };
    },
    template_string    : (self.description_template?.( input ) ?? input),
    template_arguments : {},
    get template_output () {

      const result = this.template_string.replace( /\$(\S+)/gm, (s,s1)=>{
        if ( s1 in this.template_arguments ) {
          return this.template_arguments[s1];
        } else {
        } return s1;
      });

      return result;

    },
  };

  description_object[SCHEMA_VALIDATOR_COMMAND]({command:'notify_description', type:'created', value: null });

  return {
    "description" : description_object,
  };
}


function cloneSchema() {
  if ( is_current_module_existed( this ) ) {
    throw new Error( 'currently, this module is being configured' );
  }
  const schema = createSchema();
  Object.assign( schema, this );
  return schema;
}

const make_fold = (fold_right)=>{
  return (...defs)=>{
    //1
    if ( defs.length < 1 ) {
      throw new RangeError( 'no definition was specified in `and`' );
    }

    //2
    defs.forEach( (e,i)=>{
      const m = check_if_proper_vali( e );
      if ( m !== null ) {
        throw new RangeError(`the argument at or(${i}) is ${m}` );
      }
    });

    return (
      /*
       * the following code was duplicated from object() and modified.
       * (Fri, 22 Dec 2023 15:03:14 +0900)
       */
      name_validator( "fold", (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }

        if ( ! Array.isArray( o ) ) {
          return false;
        }

        if ( defs.length === 0 ) {
          return true;
        }

        // >>> ADDED (Tue, 09 May 2023 16:31:43 +0900)
        o = unprevent(o);
        // <<< ADDED (Tue, 09 May 2023 16:31:43 +0900)


        /*
         * a left-side object always overrides all of the objects on its
         * right-side if the left parameter is true;
         */
        if ( fold_right ) {
          o = o.toReversed();
        }

        /*
         * Merge all arguments into one;
         */
        const folded_o = Object.assign({}, ...o );

        // This implements the logical operator `and`; check every element
        // before determine the result to obtain a user-friendly diagnosis
        // report.t-hop
        return (
          defs.map( (f,i)=>{
            c.enter(i,f);
            try {
              return c.notify( f(folded_o,c) );
            } finally {
              c.leave();
            }
          }).every(e=>!!e)
        );
      })
    );
  };
};


const standardValis = {
  "any"         : (...defs)=>name_validator("any"        ,(o)=>true ),
  "none"        : (...defs)=>name_validator("none"       ,(o)=>false ),
  "undefined"   : (...defs)=>name_validator("undefined"  ,(o)=>typeof o === "undefined"),
  "null"        : (...defs)=>name_validator("null"       ,(o)=>o === null ),
  "boolean"     : (...defs)=>name_validator("boolean"    ,(o)=>o !== undefined && o!==null && typeof o === "boolean" ),
  "number"      : (...defs)=>name_validator("number"     ,(o)=>o !== undefined && o!==null && typeof o === "number"  ),
  "string"      : (...defs)=>name_validator("string"     ,(o)=>o !== undefined && o!==null && typeof o === "string"  ),
  "bigint"      : (...defs)=>name_validator("bigint"     ,(o)=>o !== undefined && o!==null && typeof o === "bigint"  ),
  "symbol"      : (...defs)=>name_validator("symbol"     ,(o)=>o !== undefined && o!==null && typeof o === "symbol"  ),
  "function"    : (...defs)=>name_validator("function"   ,(o)=>o !== undefined && o!==null && typeof o === "function"),
  "defined" : (...defs)=>{
    const sub_validator = defs[0] ?? (()=>true);
    const validator_hook = (c,o,k,v)=>{
      if ( k in o ) {
        return sub_validator(o[k],c);
      } else {
        return sub_validator(undefined,c);
      }
    };
    const validator = (...args)=>sub_validator(...args);
    name_validator( "defined", validator );
    set_validator_hook( validator, validator_hook );
    return validator;
  },
  "or"          : (...defs)=>{
    if ( defs.length < 1 ) {
      throw new RangeError( 'no definition was specified in `or`' );
    }

    defs.forEach( (e,i)=>{
      const m = check_if_proper_vali( e );
      if ( m !== null ) {
        throw new RangeError(`the argument at or(${i}) is ${m}` );
      }
    });

    return (
      name_validator( "or", (o,c=null_context)=>{
        // This implements the logical operator `or`; check every element
        // before determine the result to obtain a user-friendly diagnosis
        // report.
        return (
          defs.map( (f,i)=>{
            c.enter(i,f);
            try {
              return c.notify( f(o,c) );
            } finally {
              c.leave();
            }
          }).some(e=>!!e)
        );
      })
    );
  },

  "and" : (...defs)=>{
    //1
    if ( defs.length < 1 ) {
      throw new RangeError( 'no definition was specified in `and`' );
    }
    //2
    defs.forEach( (e,i)=>{
      const m = check_if_proper_vali( e );
      if ( m !== null ) {
        throw new RangeError(`the argument at or(${i}) is ${m}` );
      }
    });

    //3
    return (
      name_validator( "and", (o,c=null_context)=>{
        // This implements the logical operator `and`; check every element
        // before determine the result to obtain a user-friendly diagnosis
        // report.
        return (
          defs.map( (f,i)=>{
            c.enter(i,f);
            try {
              return c.notify( f(o,c) );
            } finally {
              c.leave();
            }
          }).every(e=>!!e)
        );
      })
    );
  },

  "not" : (def)=>{
    if ( def === undefined || def === null ) {
      throw new RangeError( 'no definition was specified in `not`' );
    }
    return (
      name_validator( "not", (o,c=null_context)=>{
        return (
          ! (()=>{
            c.enter('op',def);
            try {
              return c.notify( def( o,c ) );
            } finally {
              c.leave();
            }
          })()
        );
      })
    );
  },

  "thru" : (def)=>{
    if ( def === undefined || def === null ) {
      throw new RangeError( 'no definition was specified in `not`' );
    }
    return (
      name_validator( "thru", (o,c=null_context)=>{
        return (
          (()=>{
            c.enter('op',def);
            try {
              return c.notify( def( o,c ) );
            } finally {
              c.leave();
            }
          })()
        );
      })
    );
  },

  "object" : (...defs)=>{
    if ( ! defs.every(e=>e!==null && e!==undefined && (typeof e ==='object'))) {
      throw new RangeError( 'every argument must be an object' );
    }

    return (
      name_validator( "object", (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }

        if ( typeof o !== 'object' ) {
          return false;
        }

        // >>> ADDED (Tue, 09 May 2023 16:31:43 +0900)
        o = unprevent(o);
        // <<< ADDED (Tue, 09 May 2023 16:31:43 +0900)

        // This implements `object` operator; check every element before
        // determine the result to obtain a user-friendly diagnosis report.

        // `r` is an two-dimentional array of boolean.
        const r =
          defs.map(
            def=>Object.entries(def).map(
              ([key,value])=>{
                c.enter(key,value);
                try {
                  /*
                   * the default validator_hook is c.notify( value( o[key], c ) );
                   * See get_validator_hook() for further information.
                   */
                  return c.notify( get_validator_hook( value )(c,o,key,value) );
                  // return c.notify( value( obj_nargs[key], c ) );
                } finally {
                  c.leave();
                }
              }));
        // check if every element is true.
        return  r.every(e1=>e1.every(e2=>!!e2));
      })
    );
  },

  "array_of"    : (...defs)=>{
    return (
      name_validator( "array_of", (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }
        if ( ! Array.isArray( o ) ) {
          return false;
        }
        // >>> ADDED (Tue, 09 May 2023 16:31:43 +0900)
        o = unprevent(o);
        // <<< ADDED (Tue, 09 May 2023 16:31:43 +0900)

        const r = defs.map(
          (def,di)=>{
            return o.map( (e,i)=>{
              c.enter( `${i}`, def);
              try {
                return c.notify( def(e,c) );
              } finally {
                c.leave();
              }
            })
          });
        // check if every element is true.
        return  r.every(e1=>e1.every(e2=>!!e2));
        // return defs.every( (def)=>o.every(e=>def(e)));
      })
    );
  },

  "array"    : (...defs)=>{
    return (
      name_validator( "array", (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }
        if ( ! Array.isArray( o ) ) {
          return false;
        }

        // >>> ADDED (Tue, 09 May 2023 16:31:43 +0900)
        o = unprevent(o);
        // <<< ADDED (Tue, 09 May 2023 16:31:43 +0900)

        const r = defs.map( (def,i)=>{
          c.enter( `${i}`, def);
          try {
            return c.notify( def( o[i], c ) );
          } finally {
            c.leave();
          }
        });

        const rr = (()=>{
          if ( o.length != defs.length ) {
            c.enter( `arr:${o.length}!==def:${defs.length}` , {[SCHEMA_VALIDATOR_NAME]: 'length-comparator'  } );
            try {
              return c.notify( false );
            } finally {
              c.leave();
            }
          } else {
            return true;
          }
        })();

        return rr && r.every(e1=>!!e1);

        // return defs.every( (def,i)=>def( o[i] ) );
      })
    );
  },

  "fold" : make_fold( false ),

  "fold_right" : make_fold( true ),

  "nargs" : (...defs)=>{
    if ( ! defs.every(e=>e!==null && e!==undefined && (typeof e ==='object'))) {
      throw new RangeError( 'every argument must be an object' );
    }

    return (
      /*
       * the following code was duplicated from object() and modified.
       * (Fri, 22 Dec 2023 15:03:14 +0900)
       */
      name_validator( "nargs", (o,c=null_context)=>{
        if ( o === null || o === undefined ) {
          return false;
        }

        if ( ! Array.isArray( o ) ) {
          return false;
        }

        if ( defs.length === 0 ) {
          return true;
        }

        // >>> ADDED (Tue, 09 May 2023 16:31:43 +0900)
        o = unprevent(o);
        // <<< ADDED (Tue, 09 May 2023 16:31:43 +0900)

        /*
         * Merge all arguments into one; a left-side object always overrides
         * all of the objects on its right-side.
         */
        const obj_nargs = Object.assign({}, ...( o.toReversed() ) );

        // This implements `object` operator; check every element before
        // determine the result to obtain a user-friendly diagnosis report.

        // `r` is an two-dimentional array of boolean.
        const r =
          defs.map(
            def=>Object.entries(def).map(
              ([key,value])=>{
                c.enter(key,value);
                try {
                  /*
                   * the default validator_hook is c.notify( value( o[key], c ) );
                   * See get_validator_hook() for further information.
                   */
                  return c.notify( get_validator_hook( value )(c,obj_nargs,key,value) );
                  // return c.notify( value( obj_nargs[key], c ) );
                } finally {
                  c.leave();
                }
              }));
        // check if every element is true; that is, this is an `and` operation.
        return  r.every(e1=>e1.every(e2=>!!e2));
      })
    );
  },

  "equals"    :(val)=>name_validator( "equals", (o)=>o === val ),

  "uuid"    : (...defs)=>{
    return (
      name_validator(
        "uuid",
        (o)=>(typeof o ==='string') && (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test( o )
      )
    );
  },

  "regexp"    : (...defs)=>name_validator("regexp" , (
    (o)=>{
      if ( o === undefined )
        return false;

      if ( o === null )
        return false;

      const regexp = defs?.[0];

      if ( !( regexp instanceof RegExp ) )
        throw new Error('the only argument must be an instance of RegExp() class' );

      return regexp.test( o.toString() );
    }
  )),

  [SCHEMA_VALIDATOR_COMPILE] : schema_validator_template_literal_compile,
  [SCHEMA_VALIDATOR_DEFINE] : schema_validator_template_literal_define,

  [SCHEMA_VALIDATOR_CURRENT_COMPILE] : schema_validator_template_literal_compile,
  [SCHEMA_VALIDATOR_CURRENT_DEFINE] : schema_validator_template_literal_define,

  "statement" : function statement(...args) {
    console.warn( '`statement` is deprecated; use `compile`, instead.' );
    return this[SCHEMA_VALIDATOR_CURRENT_COMPILE].call(this,...args);
  },
  "compile" : function compile(...args) {
    return this[SCHEMA_VALIDATOR_CURRENT_COMPILE].call(this,...args);
  },
  "define" : function define(...args) {
    return this[SCHEMA_VALIDATOR_CURRENT_DEFINE].call(this,...args);
  },
  "BEGIN_MODULE"   : BEGIN_MODULE,
  "END_MODULE"     : END_MODULE,
  "VISIT_MODULE"   : VISIT_MODULE,
  "description"    : notify_description,
  "description_template" : (s)=>`## \$method_name\n${s}`,
  "clone"          : cloneSchema,
};



/*
 * *****  WARNING FOR A SPECIAL HARD CODING *****
 *
 * 1. The module `prevent-undefined` already has a dependency ot the module
 *    `vanilla-schema-validator` as a reference to `trace_validator()`
 *    function.
 * 2. The module `prevent-undefined` is built via `sqlmacro` simple build
 *    system which only supports single-index.js-projects.
 * 3. That is, any circular dependencies are not allowed since index.js is not
 *    easily split up to submodules.
 * 4. The operators sucha as array()/array_of()/object() in
 *    `vanilla-schema-validator` should call `unprevent()` before they process
 *    their objects specified as arguments to have `undefined()` operator work
 *    properly.
 *
 * The following block of code is copied from the module
 * `prevent-undefined/index.js`; and it should be synchronized to the original
 * block of code.
 *
 * (Tue, 09 May 2023 16:31:43 +0900)
 *
 *
 * BEGIN HARD CODING >>>
 *
 */
const __UNPREVENT__                            = Symbol.for( '__UNPREVENT__' );
const __IS_PREVENTED_UNDEFINED__               = Symbol.for( '__IS_PREVENTED_UNDEFINED__' );
function isUndefinedPrevented(o){
  if ( o && Object.hasOwn( o, __IS_PREVENTED_UNDEFINED__ ) ) {
    return true;
  } else {
    return false;
  }
}

function unprevent(o) {
  if ( isUndefinedPrevented(o) ) {
    return unprevent( o[__UNPREVENT__] );
  } else {
    return o;
  }
}
/*
 * <<< END HARD CODING
 *
 * (Tue, 09 May 2023 16:31:43 +0900)
 *
 */


function createSchema() {
  return {
    [VANILLA_SCHEMA_VALIDATOR_CURRENT_MODULE] : null,
    [VANILLA_SCHEMA_VALIDATOR_MODULES] : [],
  };
}

const schema = (()=>{
  const schema = createSchema();
  Object.assign( schema, standardValis );
  return schema;
})();


