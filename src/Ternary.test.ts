import { describe, expect, it, vi } from 'vitest';
import Expression from "./index.js";

const run = (expression: string, context: object = {}) => Expression(expression).execute(context, { quiet: false });

describe("Ternary (condition ? a : b) expressions", () => {
    it('should pick the consequent when the test is truthy and the alternate otherwise', () => {
        // Act / Assert
        expect(run("$.a ? $.b : $.c", { a: 1, b: 'yes', c: 'no' })).toBe('yes');
        expect(run("$.a ? $.b : $.c", { a: 0, b: 'yes', c: 'no' })).toBe('no');
    });

    it('should return a falsy consequent instead of falling through like && ||', () => {
        // Act / Assert
        expect(run("$.flag ? '' : 'fallback'", { flag: true })).toBe('');
        expect(run("$.flag ? 0 : 1", { flag: true })).toBe(0);
    });

    it('should support the design example class expression', () => {
        // Act / Assert
        expect(run("$.selected ? 'on' : ''", { selected: true })).toBe('on');
        expect(run("$.selected ? 'on' : ''", { selected: false })).toBe('');
    });

    it('should use a comparison or a && || chain as the test (lowest precedence)', () => {
        // Act / Assert
        expect(run("$.n > 2 ? 'big' : 'small'", { n: 3 })).toBe('big');
        expect(run("$.n > 2 ? 'big' : 'small'", { n: 1 })).toBe('small');
        expect(run("$.a && $.b ? 'both' : 'not both'", { a: 1, b: 0 })).toBe('not both');
        expect(run("$.a || $.b ? 'either' : 'neither'", { a: 0, b: 1 })).toBe('either');
    });

    it('should allow && || chains in the branches', () => {
        // Act / Assert
        expect(run("$.a ? $.b && 'x' : $.c || 'y'", { a: 0, b: 1, c: 0 })).toBe('y');
        expect(run("$.a ? $.b && 'x' : $.c || 'y'", { a: 1, b: 1, c: 0 })).toBe('x');
    });

    it('should associate to the right for chained ternaries', () => {
        // Arrange
        const expression = "$.n > 2 ? 'big' : $.n > 1 ? 'medium' : 'small'";

        // Act / Assert
        expect(run(expression, { n: 3 })).toBe('big');
        expect(run(expression, { n: 2 })).toBe('medium');
        expect(run(expression, { n: 1 })).toBe('small');
    });

    it('should nest a ternary in the consequent', () => {
        // Act / Assert
        expect(run("$.a ? $.b ? 'ab' : 'a' : 'none'", { a: 1, b: 0 })).toBe('a');
        expect(run("$.a ? $.b ? 'ab' : 'a' : 'none'", { a: 1, b: 1 })).toBe('ab');
        expect(run("$.a ? $.b ? 'ab' : 'a' : 'none'", { a: 0, b: 1 })).toBe('none');
    });

    it('should ignore ? and : inside strings, objects, arrays and calls', () => {
        // Act / Assert
        expect(run("$.a ? 'is it? yes: really' : 'b'", { a: 1 })).toBe('is it? yes: really');
        expect(run("$.a ? {k: 'v'} : [1, 2]", { a: 1 })).toEqual({ k: 'v' });
        expect(run("$.a ? {k: 'v'} : [1, 2]", { a: 0 })).toEqual([1, 2]);
        expect(run("{k: $.a ? 'y' : 'n'}", { a: 1 })).toEqual({ k: 'y' });
        expect(run("$.fn($.a ? 'y' : 'n')", { a: 0, fn: (v: string) => `got ${v}` })).toBe('got n');
    });

    it('should combine with concatenation in a branch', () => {
        // Act / Assert
        expect(run("$.a ? 'x' +++ $.b : 'none'", { a: 1, b: 'y' })).toBe('xy');
    });

    it('should only evaluate the branch that is taken', () => {
        // Arrange
        const yes = vi.fn(() => 'yes');
        const no = vi.fn(() => 'no');

        // Act
        const result = run("$.a ? $.yes() : $.no()", { a: 1, yes, no });

        // Assert
        expect(result).toBe('yes');
        expect(yes).toHaveBeenCalledTimes(1);
        expect(no).not.toHaveBeenCalled();
    });

    it('should list the variables of the test, then the consequent, then the alternate', () => {
        // Act / Assert
        expect(Expression("$.a ? $.b : $.c").variables).toEqual(['$.a', '$.b', '$.c']);
        expect(Expression("$.n > 2 ? $.big : $.small").variables).toEqual(['$.n', '$.big', '$.small']);
    });

    it('should not treat an unspaced ? or ?? as a ternary', () => {
        // Act / Assert: a regex using ? still parses as a match, not a ternary
        expect([...run("$.s /colou?r/g", { s: 'color colour' })].map((m: RegExpMatchArray) => m[0])).toEqual(['color', 'colour']);
        expect(() => Expression("$.a ?? $.b")).toThrow();
    });

    it('should throw for a ? with no matching :', () => {
        // Act / Assert
        expect(() => Expression("$.a ? $.b")).toThrow('Invalid Expression');
    });
});
