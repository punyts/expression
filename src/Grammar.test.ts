import { describe, expect, it } from 'vitest';
import Expression from "./index.js";

const run = (expression: string, context: object = {}) => Expression(expression).execute(context, { quiet: false });

const drain = (iterator: { next: () => any }) => {
    const rows: any[] = [];
    for (let row = iterator.next(); row !== undefined; row = iterator.next()) {
        rows.push(row);
    }
    return rows;
};

const people = () => [
    { name: 'Cara', age: 3 },
    { name: 'Abe', age: 1 },
    { name: 'Bo', age: 2 }
];

describe("Grammar characterisation: precedence without parentheses", () => {
    it('should bind && tighter than || (truthy results)', () => {
        // Arrange
        const context = { a: 1, b: 0, c: 'x', d: null };

        // Act / Assert
        expect(run("$.a || $.b && $.d", context)).toBe(1);
        expect(run("$.b || $.a && $.c", context)).toBe('x');
        expect(run("$.b && $.a || $.c", context)).toBe('x');
        expect(run("$.a && $.b || $.c", context)).toBe('x');
    });

    it('should return the last value of a truthy && chain and || short circuits on the first truthy value', () => {
        // Act / Assert
        expect(run("$.a && $.c", { a: 1, c: 'x' })).toBe('x');
        expect(run("$.a || $.c", { a: 'first', c: 'x' })).toBe('first');
        expect(run("$.a || $.c", { a: 0, c: 'x' })).toBe('x');
    });

    it('should return the JavaScript operand value of a && and || chain', () => {
        // Act / Assert
        expect(run("$.a && $.c", { a: 0, c: 'x' })).toBe(0);
        expect(run("!$.a && $.c", { a: 1, c: 'x' })).toBe(false);
        expect(run("$.b || $.d && $.c", { b: 0, d: null, c: 'x' })).toBeNull();
        expect(run("$.d || $.b && $.c", { b: 0, d: null, c: 'x' })).toBe(0);
        expect(run("$.a || $.b", { a: 0, b: '' })).toBe('');
        expect(run("$.a && $.b && $.c", { a: 1, b: 0, c: 'x' })).toBe(0);
        expect(run("$.a && $.b || $.c && $.d", { a: 1, b: 1, c: 1, d: 'last' })).toBe(1);
    });

    it('should bind ! tighter than a comparison, as in JavaScript', () => {
        // Act / Assert
        expect(run("!$.n > 2", { n: 3 })).toBe(false);
        expect(run("!$.n > 2", { n: 0 })).toBe(false);
        expect(run("!$.a === true", { a: 1 })).toBe(false);
        expect(run("!$.a === false", { a: 1 })).toBe(true);
        expect(run("!!$.a === true", { a: 1 })).toBe(true);
        expect(run("!$.a isin [true]", { a: 0 })).toBe(true);
    });

    it('should bind ! tighter than an arithmetic operator', () => {
        // Act / Assert
        expect(run("!$.a + 1", { a: 0 })).toBe(2);
        expect(run("!$.fn($.a + 1)", { a: 1, fn: (x: number) => x - 2 })).toBe(true);
    });

    it('should negate the whole comparison only when it is grouped', () => {
        // Act / Assert
        expect(run("!($.n > 2)", { n: 3 })).toBe(false);
        expect(run("!($.n > 2)", { n: 0 })).toBe(true);
        expect(run("!($.a isin [1, 2])", { a: 1 })).toBe(false);
    });

    it('should bind a comparison tighter than && and ||', () => {
        // Act / Assert
        expect(run("$.n > 2 && $.n < 5", { n: 3 })).toBe(true);
        expect(run("$.n > 2 && $.n < 5", { n: 7 })).toBe(false);
        expect(run("$.n > 2 || $.n < 1 && false", { n: 3 })).toBe(true);
    });

    it('should bind && and || tighter than a ternary and nest a ternary in the alternate', () => {
        // Act / Assert
        expect(run("$.a || $.b ? 'yes' : 'no'", { a: 0, b: 1 })).toBe('yes');
        expect(run("$.a ? 'p' : $.b ? 'q' : 'r'", { a: 0, b: 1 })).toBe('q');
        expect(run("$.a ? 'p' : $.b ? 'q' : 'r'", { a: 0, b: 0 })).toBe('r');
    });
});

describe("Parenthesised groups", () => {
    it('should return the value of a group', () => {
        // Act / Assert
        expect(run("($.a)", { a: 1 })).toBe(1);
        expect(run("(($.a))", { a: 1 })).toBe(1);
    });

    it('should override the && over || precedence', () => {
        // Arrange
        const context = { a: 1, b: 0, c: 'x', d: 0 };

        // Act / Assert
        expect(run("$.a || $.b && $.d", context)).toBe(1);
        expect(!!run("($.a || $.b) && $.d", context)).toBe(false);
        expect(!!run("($.b || $.a) && $.c", context)).toBe(true);
        expect(run("$.a && ($.b || $.c)", context)).toBe('x');
        expect(!!run("$.b && ($.a || $.c)", context)).toBe(false);
    });

    it('should group comparisons', () => {
        // Act / Assert
        expect(run("($.n > 2) && ($.n < 5)", { n: 3 })).toBe(true);
        expect(run("($.n > 2) && ($.n < 5)", { n: 9 })).toBe(false);
        expect(run("$.s/^(x|y)$/g && ($.n > 2)", { s: 'x', n: 3 })).toBe(true);
    });

    it('should negate a group with !', () => {
        // Act / Assert
        expect(run("!($.a && $.b)", { a: 1, b: 0 })).toBe(true);
        expect(run("!($.a || $.b)", { a: 1, b: 0 })).toBe(false);
        expect(run("!($.a || $.b) || $.c", { a: 1, b: 0, c: 'x' })).toBe('x');
        expect(run("!!($.a)", { a: 1 })).toBe(true);
    });

    it('should group a test, a branch and an operand of a ternary', () => {
        // Act / Assert
        expect(run("($.a || $.b) ? 'yes' : 'no'", { a: 0, b: 1 })).toBe('yes');
        expect(run("$.a ? ($.b || 'f') : 'z'", { a: 1, b: 0 })).toBe('f');
        expect(run("($.a ? 1 : 2) + 1", { a: 0 })).toBe(3);
    });

    it('should group arithmetic', () => {
        // Act / Assert
        expect(run("$.n * ($.n + 1)", { n: 3 })).toBe(12);
        expect(run("($.n + 1) * $.n", { n: 3 })).toBe(12);
        expect(run("($.n + 1) > 3", { n: 3 })).toBe(true);
        expect(run("$.n / ($.a + 1)", { n: 3, a: 1 })).toBe(1.5);
    });

    it('should group inside a function argument, an array member and an object value', () => {
        // Act / Assert
        expect(run("$.fn(($.n))", { n: 3, fn: (x: number) => x * 2 })).toBe(6);
        expect(run("[($.a || $.b), 1]", { a: 0, b: 4 })).toEqual([4, 1]);
        expect(run("{ok: ($.n > 2) && ($.n < 5)}", { n: 3 })).toEqual({ ok: true });
    });

    it('should not take a call argument list or a bind for a group', () => {
        // Arrange
        const fn = (x: number) => x + 1;

        // Act
        const called = run("$.fn($.n)", { n: 1, fn });
        const bound = run("($.n)=>$.fn", { n: 1, fn });

        // Assert
        expect(called).toBe(2);
        expect(bound()).toBe(2);
    });

    it('should keep parentheses inside a regular expression literal', () => {
        // Act / Assert
        expect(Array.from(run("$.s/^(x|y)$/g", { s: 'y' }))).toHaveLength(1);
    });

    it('should collect the variables used inside a group', () => {
        // Act
        const expr = Expression("($.a || $.b) && $.c");

        // Assert
        expect(expr.variables).toEqual(expect.arrayContaining(['$.a', '$.b', '$.c']));
    });
});

describe("Parenthesised groups and chains inside an iterator filter", () => {
    it('should apply a parenthesised || group and an && in a filter', () => {
        // Arrange
        const expr = Expression("$k,$i,$v in $.list filter ($v.age === 1 || $v.age === 3) && $v.name !== 'Cara'");

        // Act
        const rows = drain(expr.execute({ list: people() }, { quiet: false }));

        // Assert
        expect(rows.map((row) => row.$v.name)).toEqual(['Abe']);
    });

    it('should apply a negated group in a filter after a sort', () => {
        // Arrange
        const expr = Expression("$k,$i,$v in $.list sort $v.age desc filter !($v.age > 2 || $v.name === 'Abe')");

        // Act
        const rows = drain(expr.execute({ list: people() }, { quiet: false }));

        // Assert
        expect(rows.map((row) => row.$v.name)).toEqual(['Bo']);
    });

    it('should apply a ternary with grouped parts in a filter', () => {
        // Arrange
        const expr = Expression("$k,$i,$v in $.list filter $.strict ? ($v.age > 1 && $v.age < 3) : ($v.age > 0)");

        // Act
        const strict = drain(expr.execute({ strict: true, list: people() }, { quiet: false }));
        const loose = drain(expr.execute({ strict: false, list: people() }, { quiet: false }));

        // Assert
        expect(strict.map((row) => row.$v.name)).toEqual(['Bo']);
        expect(loose).toHaveLength(3);
    });
});
