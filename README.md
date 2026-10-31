# Expression

The expression system is a safe mechanism for compiling and executing expressions from text. A text expression is compiled into a simple AST. Once it's compiled, it's executed with a context object, which is used to resolve variable paths. 

The system accepts a string expression, compiles it, and generates an `execute` method that when called will execute the expression with the context object provided in the execute call.

## Expression Lifecycle

1. Compile the string expression to get a `CompiledExpression`
2. Execute the compiled expression with a context object
3. Repeat step 2 when the context has changed 
4. Dereference the compiled expression to dispose of it

## Usage

```ts
import Expression from "@comptia/innovation.corets/src/expression";

//a string expression
const exprStr = "$i in $.my.list";

//compile the expression
const expr = Expression(exprStr)

//determine the context to use for the execution
const context = {
  my: {
    list: [1,2,3,4,5]
  }
};

//execute the expression with a context
const result = expr(context);
```

## Expression Types

* Literal
* Variable
* Object
* Concat
* Not
* Function
* Bind
* Conditional
* RegEx Match
* Iterator
* Chain
* Ternary
* Group (parentheses)


### Literal

A literal expression represents a primitive literal value. Literal expressions are generally used in other expressions.

```js
const stringLiteral = "'my string'";
const numberLiteral = "100";
const boolLiteral = "false";
```

### Variable

A variable expression is a path that points to a property in the context object.

```
const varExpr1 = "$.path.to.my.var";
```

### Object

An object expression builds a new object. Keys are written as identifiers, numbers or quoted strings, and each value is any expression: a literal, a variable path, an operator, a nested object or an array.

```
const obj1 = "{a: 1, 'b c': $.path.to.my.var}";
const obj2 = "{total: $.price * $.qty, tags: ['x', $.tag], meta: {ok: $.count > 0} }";
```

### Concat

A concat expression concatenates 2 or more expressions, generally variable or literal expressions, but it's not limited to those two types.

```
const concat1 = "$.path.to.my.var +++ ' ' +++ $.path.to.another.var";
const concat2 = "'This is my ' +++ $.getThingName() +++ ', do you like it?'";
```

### Not

A not expression is used to negate the result from another expression.

```
const notThis = "!$.my.var";
const boolThis = "!!$.my.var";
```

### Function

A function expression calls a function addressed by a path on the context object. The arguments are also expressions which will be resolved before the function is called.

```
const funcExpr1 = "$.my.func()"
const funcExpr2 = "$.my.func('literal', $.my.var)"
```

### Bind

A bind expression is similar to a function, but instead of calling the function, it creates a bound function with bind arguments. The result is the bound function.

```
const bindExpr1 = "($.my.var)=>$.my.func";
```

### Conditional

A conditional expression evaluates two expressions with an operator. The return value is always a boolean.

```
const condExpr1 = "$.my.num1 > $.my.num2";
const condExpr2 = "$.my.func() === 'red'";
const condExpr3 = "$.my.num isin [1,3,5,6]";
const condExpr4 = "$.my.var is [regexp]";
```

#### Operators

| Operator | Description |
| ----- | -- |
| ==    | Coercive equality
| ===   | Equality
| !=    | Negative coercive equality
| !==   | Negative equality
| \>    | Greater than
| \>=   | Greater than or equal
| <     | Less than
| \<=    | Less than of equal
| is    | Type check. The type of the left side values equals the string type on the right side; string, number, etc.
| !is   | Negative type check
| isin  | Contains check. The value of the left side is found in the value on the right side
| !isin | Negative contains check

### RegExp Match

A regexp match expression takes a value and a regular expression pattern and returns the match.

```
const matchExpr1 = "$.my.var/^America$/i";
const matchExpr2 = "$.my.func()/this/g";
```

### Iterator

An iterator expression creates an iterator for an object or an array.


#### Iterator Expression Parts
```text
                                 sort    sort        filter
  vars   op   collection         value   dir          expr
┌──────┐ ┌┐ ┌────────────┐      ┌──────┐ ┌──┐        ┌────┐
$k,$i,$v in $.my.groceries sort $v.price desc filter $k > 1
```

```
const iter1 = "$k in $.my.data";
const iter2 = "key,indx,value in $.my.groceries sort $v.price filter $k !== 'milk'";
const iter3 = "$k for 10";
```

### Chain

A chain expression ties other expressions together with logical ANDs(&&) and ORs||).

```
const chain1 = "$.my.val1 === 1 && 'green' || 'blue'";
```

### Ternary

A ternary expression picks one of two expressions from a test: `test ? consequent : alternate`. The `?` and `:` are surrounded by spaces. Only the branch that is taken is evaluated.

```
const ternary1 = "$.selected ? 'on' : ''";
const ternary2 = "$.a ? 'p' : $.b ? 'q' : 'r'";
```

### Group

Parentheses group an expression so it is parsed and evaluated as a whole. A group can hold any expression and can be used wherever an expression is accepted: as an operand of `!`, a comparison, an arithmetic operator, `&&`, `||`, as a ternary test or branch, in a function argument, an array member, an object value or an iterator filter. The parentheses of a function call and of a bind are not groups.

```
const group1 = "($.a || $.b) && $.c";
const group2 = "!($.a && $.b)";
const group3 = "$.n * ($.n + 1)";
const group4 = "$k,$i,$v in $.list filter ($v.age === 1 || $v.age === 3) && $v.name !== 'Cara'";
```

A "/" that is not a division must not be written with a space on both sides, so a regular expression literal such as `/^(x|y)$/g` keeps its parentheses; write division with a space on each side (`$.a / ($.b + 1)`).

## Precedence

From the tightest binding to the loosest:

1. Parenthesised groups, function calls, literals and variable paths
2. `!` and `!!`, which negate only the operand after them, as in JavaScript: `!$.n > 2` is `(!$.n) > 2`. Write `!($.n > 2)` to negate a comparison.
3. Arithmetic operators (`**`, `*`, `/`, `%`, `+`, `-`, `<<`, `>>`, `>>>`) and `+++` (concat)
4. Comparisons (`==`, `===`, `!=`, `!==`, `>`, `>=`, `<`, `<=`, `is`, `!is`, `isin`, `!isin`)
5. `&&`
6. `||`
7. Ternary `? :` (right-associative; the test and both branches may hold `&&` and `||` chains)

`&&` and `||` return the value of the last operand they evaluated, as JavaScript does: `0 && 10` is `0`, `$.b || $.d && $.c` with b=0, d=null is `null`, and `'a' || 'b'` is `'a'`.

An iterator owns everything after `filter`, so `||`, `&&`, groups and a ternary in the filter belong to the filter. The `||`/`&&` filter fix (commit `e2d5085`) is covered by tests in `src/Executor.test.ts` ("should apply both operands of an || filter", "should return an iterator filtered by both operands of an && filter", "should sort and then apply an || filter", "should apply a ternary filter").

### Characterised results

These results are pinned by `src/Grammar.test.ts`:

| Expression | Context | Result |
| -- | -- | -- |
| `$.a || $.b && $.d` | a=1, b=0, d=null | `1` (`&&` binds tighter) |
| `$.b || $.a && $.c` | a=1, b=0, c='x' | `'x'` |
| `$.a && $.c` | a=1, c='x' | `'x'` |
| `$.a && $.c` | a=0, c='x' | `0` |
| `$.a || $.c` | a=0, c='x' | `'x'`; a truthy first operand is returned as is |
| `$.b || $.d && $.c` | b=0, d=null | `null` |
| `!$.n > 2` | n=3 / n=0 | `false` / `false` (`(!$.n) > 2`) |
| `!($.n > 2)` | n=3 / n=0 | `false` / `true` |
| `!$.a + 1` | a=0 | `2` (`(!$.a) + 1`) |
| `$.n > 2 && $.n < 5` | n=3 | `true` |
| `$.a ? 'p' : $.b ? 'q' : 'r'` | a=0, b=1 | `'q'` (nests in the alternate) |
| `$.a || $.b ? 'yes' : 'no'` | a=0, b=1 | `'yes'` |
| `($.a || $.b) && $.d` | a=1, b=0, d=0 | `0` (the group is evaluated first) |
