# Changelog

## 1.5.1
- **Nested calls.** A function argument may itself be a call: `coalesce(max($.items, 'n'), 0)` and `empty(trim($.name))` parse. Arguments are split on commas outside any group, so commas inside nested calls, arrays and objects stay with their argument. These threw "does not fit any expression patterns" before.

## 1.5.0
- **Left-to-right associativity.** Binary operators of equal precedence associate left to right, as in JavaScript: `$.a / $.b * 100` is `($.a / $.b) * 100` (was `$.a / ($.b * 100)`) and `$.a - $.b + 1` is `($.a - $.b) + 1` (was `$.a - ($.b + 1)`). `*`, `/` and `%` share a level, as do `+` and `-` and the shifts; `**` is right-associative. Breaking for expressions that relied on the old right-to-left grouping.
- **Comparisons follow JavaScript precedence.** Arithmetic binds tighter than a comparison (`$.a + 1 > $.b` compares the sum; it used to evaluate to the sum), relational comparisons bind tighter than equality, and comparison chains such as `$.a == $.b == false` parse and associate left to right.
- A `+` or `-` where an operand is expected is a sign, so `$.a * -1` and `$.a - -1` evaluate instead of throwing.

## 1.4.0
- **Grouping and precedence.** Parenthesised groups work everywhere an expression does, including iterator filters. Precedence follows JavaScript: `!` binds tightest (`!$.n > 2` is `(!$.n) > 2`), then arithmetic, comparisons, `&&`, `||` and the ternary; `&&` and `||` return the operand values (`0 && 10` is `0`). Breaking for expressions that relied on a leading `!` negating a whole comparison or on `&&` returning `undefined` (AMM-1646).
- Fixed an infinite loop parsing `($.a || $.b) && $.c`.

## 1.3.0
- The `?:` ternary operator.

## 1.2.0
- JavaScript-style object literals.
