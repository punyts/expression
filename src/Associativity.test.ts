import { describe, expect, it } from 'vitest';
import Expression from "./index.js";

const run = (expression: string, context: object = {}) => Expression(expression).execute(context, { quiet: false });

const context = Object.freeze({ a: 50, b: 200, c: 3, max: 60, value: 30 });

describe("Associativity of arithmetic operators of equal precedence", () => {
    it.each([
        ["$.a / $.b * 100", 25],
        ["$.a * $.b / 100", 100],
        ["$.b / $.a / 2", 2],
        ["$.a * $.c * 2", 300],
        ["$.b % 7 * 2", 8],
        ["$.b * 7 % 3", 2],
        ["$.b % 7 / 2", 2],
        ["$.b / 8 % 3", 1],
        ["$.b % 7 % 3", 1],
        ["100 / 10 / 5 * 2", 4]
    ])('should evaluate "%s" left to right as %d', (expression, expected) => {
        // Act
        const result = run(expression, context);

        // Assert
        expect(result).toBe(expected);
    });

    it.each([
        ["$.a - $.b + 1", -149],
        ["$.a + $.b - 1", 249],
        ["$.b - $.a - 1", 149],
        ["$.a - $.b - $.c", -153],
        ["$.a + $.b + $.c", 253],
        ["1 - 2 - 3 - 4", -8]
    ])('should evaluate "%s" left to right as %d', (expression, expected) => {
        // Act
        const result = run(expression, context);

        // Assert
        expect(result).toBe(expected);
    });

    it.each([
        ["256 >> 2 << 1", 128],
        ["1 << 4 >> 2", 4],
        ["-16 >>> 28 >> 1", 7]
    ])('should evaluate the shifts in "%s" left to right as %d', (expression, expected) => {
        // Act
        const result = run(expression);

        // Assert
        expect(result).toBe(expected);
    });

    it('should evaluate ** right to left, as JavaScript does', () => {
        // Act
        const result = run("2 ** 3 ** 2");

        // Assert
        expect(result).toBe(512);
    });

    it('should bind * and / tighter than + and - on either side', () => {
        // Act / Assert
        expect(run("$.a + $.b * $.c - 1", context)).toBe(649);
        expect(run("$.a - $.b / 4 + 1", context)).toBe(1);
        expect(run("$.c * 2 - $.b / $.a * 2", context)).toBe(-2);
    });

    it('should read a "+" or "-" where an operand is expected as a sign', () => {
        // Act / Assert
        expect(run("$.a * -1", context)).toBe(-50);
        expect(run("$.a - -1", context)).toBe(51);
        expect(run("$.a / -2 * 4", context)).toBe(-100);
    });

    it('should compute a percentage without parentheses', () => {
        // Act
        const result = run("$.value / $.max * 100", context);

        // Assert
        expect(result).toBe(50);
    });
});

describe("Associativity with parenthesised groups", () => {
    it('should evaluate a group first wherever it is in a chain', () => {
        // Act / Assert
        expect(run("($.a - $.b) + 1", context)).toBe(-149);
        expect(run("$.a - ($.b + 1)", context)).toBe(-151);
        expect(run("$.a / ($.b * 100)", context)).toBe(0.0025);
        expect(run("($.a / $.b) * 100", context)).toBe(25);
        expect(run("($.value * 100) / $.max", context)).toBe(50);
        expect(run("$.b / ($.a / 2)", context)).toBe(8);
    });
});

describe("Associativity of comparisons", () => {
    it('should evaluate a relational chain left to right', () => {
        // Act / Assert
        expect(run("$.c < $.a < $.b", context)).toBe(true);
        expect(run("$.b > $.a > $.c", context)).toBe(false);
        expect(run("$.a > $.b < $.c", context)).toBe(true);
    });

    it('should evaluate an equality chain left to right', () => {
        // Act / Assert
        expect(run("$.a == $.b == false", context)).toBe(true);
        expect(run("$.a === 50 !== false", context)).toBe(true);
    });

    it('should bind relational comparisons tighter than equality', () => {
        // Act / Assert
        expect(run("$.a < $.b == true", context)).toBe(true);
        expect(run("true == $.a < $.b", context)).toBe(true);
    });

    it('should bind arithmetic tighter than a comparison', () => {
        // Act / Assert
        expect(run("$.a + 1 > $.b", context)).toBe(false);
        expect(run("$.a * 2 > $.b - 150", context)).toBe(true);
        expect(run("$.a / $.b * 100 === 25", context)).toBe(true);
    });

    it('should keep a type check operand intact', () => {
        // Act / Assert
        expect(run("$.a is [number]", context)).toBe(true);
        expect(run("$.a + 1 is [number]", context)).toBe(true);
    });
});

describe("Associativity of && and || chains", () => {
    it('should evaluate an && chain left to right and return the first falsey value', () => {
        // Act / Assert
        expect(run("$.a && $.z && $.b", { a: 1, z: 0, b: 2 })).toBe(0);
        expect(run("$.a && $.c && $.b", { a: 1, c: 'x', b: 2 })).toBe(2);
    });

    it('should evaluate an || chain left to right and return the first truthy value', () => {
        // Act / Assert
        expect(run("$.z || $.a || $.b", { z: 0, a: 1, b: 2 })).toBe(1);
        expect(run("$.z || $.n || $.e", { z: 0, n: null, e: '' })).toBe('');
    });

    it('should bind && tighter than || in a mixed chain', () => {
        // Act / Assert
        expect(run("$.t && $.f || $.t", { t: true, f: false })).toBe(true);
        expect(run("$.f || $.t && $.z", { t: true, f: false, z: 0 })).toBe(0);
        expect(run("$.z || $.a && $.b", { z: 0, a: 50, b: 200 })).toBe(200);
    });

    it('should evaluate comparisons with arithmetic operands inside a chain', () => {
        // Act
        const result = run("$.a - $.b + 1 < 0 && $.a / $.b * 100 > 20", context);

        // Assert
        expect(result).toBe(true);
    });
});
