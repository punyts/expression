# Changelog

## 1.4.0
- **Grouping and precedence.** Parenthesised groups work everywhere an expression does, including iterator filters. Precedence follows JavaScript: `!` binds tightest (`!$.n > 2` is `(!$.n) > 2`), then arithmetic, comparisons, `&&`, `||` and the ternary; `&&` and `||` return the operand values (`0 && 10` is `0`). Breaking for expressions that relied on a leading `!` negating a whole comparison or on `&&` returning `undefined` (AMM-1646).
- Fixed an infinite loop parsing `($.a || $.b) && $.c`.

## 1.3.0
- The `?:` ternary operator.

## 1.2.0
- JavaScript-style object literals.
