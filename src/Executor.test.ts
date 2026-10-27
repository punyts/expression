import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Executor from "./Executor.js";
import Expression from "./index.js";
import { 
    ArrayNode, 
    ChainNode, 
    ConcatNode, 
    ConditionalNode, 
    ExpressionNode, 
    FuncNode, 
    IteratorNode, 
    LiteralNode, 
    LogicalNode, 
    NotNode, 
    ObjectNode, 
    OperatorNode, 
    RegExpMatchNode, 
    RegExpNode, 
    TypeNode, 
    VariableNode 
} from "./Types.js";

describe("Execute variable expression", () => {
    const exprNode: VariableNode = {
        type: "variable",
        path: "$.my.var"
    };
    const context = {
        my: {
            var: "my var"
        }
    }
    const result = Executor(exprNode, context);

    it("should return value", () => {
        expect(result).toBe("my var");
    });
});

describe("Execute concat expression", () => {
    const concatNode1: VariableNode = {
        type: "variable",
        path: "$.my.var"
    };
    const concatNode2: LiteralNode = {
        type: "literal",
        value: "my car"
    };
    const concatNode3: FuncNode = {
        type: "execution",
        path: "$.my.func",
        arguments: []
    };
    const exprNode: ConcatNode = {
        type: "concat",
        expressions: [
            concatNode1,
            concatNode2,
            concatNode3
        ]
    };
    const context = {
        my: {
            var: "This is ",
            func: ()=> ", isn't it cool!"
        }
    };
    const result = Executor(exprNode, context);

    it("should return value", () => {
        expect(result).toBe("This is my car, isn't it cool!");
    });
});

describe("Execute bind expression", () => {
    const arg1: LiteralNode = {
        type: "literal",
        value: 10
    };
    const arg2: VariableNode = {
        type: "variable",
        path: "$.my.var"
    };
    const exprNode: FuncNode = {
        type: "bind",
        path: "$.my.func",
        arguments: [
            arg1,
            arg2
        ]
    };
    const context = {
        my: {
            var: 100,
            func: (arg1: string, arg2: string) => arg1 +  arg2
        }
    };

    const resultFn = Executor(exprNode, context);
    const result = resultFn();

    it("should return value", () => {
        expect(result).toBe(110);
    });
});

describe("Execute chain expression", () => {
    const expr1: VariableNode = {
        type: "variable",
        path: "$.my.var"
    }
    const log1: LogicalNode = {
        type: "logical",
        value: "&&"
    }
    const expr2: LiteralNode = {
        type: "literal",
        value: 1000
    };

    const exprNode: ChainNode = {
        type: "chain",
        sections: [
            expr1,
            log1,
            expr2
        ]
    }

    const context = {
        my: {
            var: true
        }
    };

    const result = Executor(exprNode, context);

    it("should return the literal value", () => {
        expect(result).toBe(1000);
    });
});

describe("Execute conditional expression", () => {
    const sideA: VariableNode = {
        type: "variable",
        path: "$.my.var"
    };
    const sideB: LiteralNode = {
        type: "literal",
        value: 100
    };
    const exprNode: ConditionalNode = {
        type: "conditional",
        sideA,
        sideB,
        operator: ">"
    };
    const context = {
        my: {
            var: 1000
        }
    }
    const result = Executor(exprNode, context);

    it("should return value", () => {
        expect(result).toBe(true);
    });
});

describe('Executor', () => {
    const mockContext = {
        value: 42,
        nested: { key: 'value' },
        array: [1, 2, 3],
        func: vi.fn((arg: number) => arg * 2),
        badFn: "badFn"
    };

    const mockOptions = { quiet: true };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should handle literal nodes', () => {
        const literalNode: LiteralNode = { type: 'literal', value: 42 };
        expect(Executor(literalNode, mockContext, mockOptions)).toBe(42);
    });

    it('should handle variable nodes', () => {
        const variableNode: VariableNode = { type: 'variable', path: '$.value' };
        expect(Executor(variableNode, mockContext, mockOptions)).toBe(42);
    });

    it('should handle chain nodes', () => {
        const chainNode: ChainNode = {
            type: 'chain',
            sections: [
                { type: 'literal', value: true },
                { type: 'logical', value: '&&' },
                { type: 'literal', value: false },
            ],
        };
        expect(Executor(chainNode, mockContext, mockOptions)).toBe(false);
    });

    it('should handle conditional nodes ==', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: "5" },
            operator: '==',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes ===', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: "5" },
            operator: '===',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(false);
    });

    it('should handle conditional nodes !=', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: "5" },
            operator: '!=',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(false);
    });

    it('should handle conditional nodes !=', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: "5" },
            operator: '!==',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes >', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: 6 },
            operator: '>',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(false);
    });

    it('should handle conditional nodes >=', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: 5 },
            operator: '>=',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes <', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: 6 },
            operator: '<',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes <=', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: 5 },
            operator: '<=',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes is', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'type', value: "number" },
            operator: 'is',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes !is', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'type', value: "string" },
            operator: '!is',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes isin for object', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: "a" },
            sideB: { type: 'literal', value: { a: "1", b: "2" } },
            operator: 'isin',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes isin for regex', () => {
        const regExpMatchNode: RegExpNode = { type: "regex", pattern: /[*]/ };
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: "abcd*" },
            sideB: regExpMatchNode,
            operator: 'isin',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes isin for array', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: "a" },
            sideB: { type: 'literal', value: [1 , 2, "a"] },
            operator: 'isin',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes !isin for object', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: "a" },
            sideB: { type: 'literal', value: { d: "1", b: "2" } },
            operator: '!isin',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes !isin for regex', () => {
        const regExpMatchNode: RegExpNode = { type: "regex", pattern: /[p]/ };
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: "abcd*" },
            sideB: regExpMatchNode,
            operator: '!isin',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle conditional nodes !isin for array', () => {
        const conditionalNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: "a" },
            sideB: { type: 'literal', value: [1, 2, "b"] },
            operator: '!isin',
        };
        expect(Executor(conditionalNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle execution nodes', () => {
        const executionNode: FuncNode = {
            type: 'execution',
            path: '$.func',
            arguments: [{ type: 'literal', value: 21 }],
        };
        expect(Executor(executionNode, mockContext, mockOptions)).toBe(42);
        expect(mockContext.func).toHaveBeenCalledWith(21);
    });

    it('should handle bind nodes', () => {
        const bindNode: FuncNode = {
            type: 'bind',
            path: '$.func',
            arguments: [{ type: 'literal', value: 21 }],
        };
        const boundFunc = Executor(bindNode, mockContext, mockOptions);
        expect(typeof boundFunc).toBe('function');
        expect(boundFunc()).toBe(42);
    });

    it('should handle array nodes', () => {
        const arrayNode: ArrayNode = {
            type: 'array',
            members: [
                { type: 'literal', value: 1 },
                { type: 'literal', value: 2 },
                { type: 'literal', value: 3 },
            ],
        };
        expect(Executor(arrayNode, mockContext, mockOptions)).toEqual([1, 2, 3]);
    });

    it('should handle object nodes', () => {
        const objectNode: ObjectNode = {
            type: 'object',
            properties: {
                key1: { type: 'literal', value: 'value1' },
                key2: { type: 'literal', value: 'value2' },
            },
        };
        expect(Executor(objectNode, mockContext, mockOptions)).toEqual({
            key1: 'value1',
            key2: 'value2',
        });
    });

    it('should handle not nodes', () => {
        const notNode: NotNode = { type: 'not', expression: { type: 'literal', value: false }, not: '!' };
        expect(Executor(notNode, mockContext, mockOptions)).toBe(true);
    });

    it('should handle not not nodes', () => {
        const notNode: NotNode = { type: 'not', expression: { type: 'literal', value: false }, not: '!!' };
        expect(Executor(notNode, mockContext, mockOptions)).toBe(false);
    });

    it('should handle concat nodes with strings', () => {
        const concatNode: ConcatNode = {
            type: 'concat',
            expressions: [
                { type: 'literal', value: 'Hello' },
                { type: 'literal', value: ' ' },
                { type: 'literal', value: 'World' },
            ],
        };
        expect(Executor(concatNode, mockContext, mockOptions)).toBe('Hello World');
    });

    it('should handle concat nodes with arrays', () => {
        const concatNode: ConcatNode = {
            type: 'concat',
            expressions: [
                { type: 'literal', value: [1, 2] },
                { type: 'literal', value: [3] },
                { type: 'literal', value: [5, 6] },
            ],
        };
        expect(Executor(concatNode, mockContext, mockOptions)).toEqual([1, 2, 3, 5, 6]);
    });

    it('should handle concat nodes with mixed types', () => {
        const concatNode: ConcatNode = {
            type: 'concat',
            expressions: [
                { type: 'literal', value: "[1, 2]" },
                { type: 'literal', value: [3] },
                { type: 'literal', value: [5, 6] },
            ],
        };
        expect(Executor(concatNode, mockContext, mockOptions)).toEqual(["[1, 2]", 3, 5, 6]);
    });

    it('should handle operator nodes +', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '+',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(15);
    });

    it('should handle operator nodes + with arrays', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '+',
            expressions: [
                { type: 'literal', value: [5] },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toEqual([5, 10]);
    });

    it('should handle operator nodes + with arrays', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '+',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: [10] },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toEqual([5, 10]);
    });

    it('should handle operator nodes **', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '**',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(9765625);
    });

    it('should handle operator nodes *', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '*',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(50);
    });

    it('should handle operator nodes /', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '/',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(0.5);
    });

    it('should handle operator nodes %', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '%',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(5);
    });

    it('should handle operator nodes -', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '-',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(-5);
    });

    it('should handle operator nodes <<', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '<<',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(5120);
    });

    it('should handle operator nodes >>', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '>>',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(0);
    });

    it('should handle operator nodes >>>', () => {
        const operatorNode: OperatorNode = {
            type: 'operator',
            operator: '>>>',
            expressions: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(operatorNode, mockContext, mockOptions)).toBe(0);
    });

    it('should throw an error for invalid expression types', () => {
        const invalidNode = { type: 'invalid' };
        expect(() => Executor(invalidNode as ExpressionNode, mockContext, mockOptions)).toThrow(
            '[Invalid Expression Type] The expression type given is not valid. (invalid)'
        );
    });

    it('should handle iterator nodes', () => {
        const iteratorNode: IteratorNode = {
            type: 'iterator',
            collection: { type: 'literal', value: [3, 1, 2] },
            operator: 'in',
            lookup: { key: '$key', index: '$index', value: '$value' },
            filter: { type: 'literal', value: true },
            sort: { by: "$index", direction: "asc" },
            step: 1,
        };
        const iterator = Executor(iteratorNode, mockContext, mockOptions);
        expect(iterator.lookup).toEqual({ "index": "$index", "key": "$key", "value": "$value" });
        expect(iterator.collection).toEqual([3, 1, 2]);
        expect(iterator.length).toEqual(3);
        expect(iterator.keys).toEqual(['0', '1', '2']);
        expect(iterator.index).toEqual(0);
        expect(iterator.next()).toEqual({ "$index": 0, "$key": "0", "$value": 3 });
        expect(iterator.index).toEqual(1);
        iterator.reset();
        expect(iterator.index).toEqual(0);
    });

    it('should handle iterator nodes negative step', () => {
        const iteratorNode: IteratorNode = {
            type: 'iterator',
            collection: { type: 'literal', value: [3, 1, 2] },
            operator: 'in',
            lookup: { key: '$key', value: '$value' },
            filter: { type: 'literal', value: true },
            sort: { by: "$key", direction: "desc" },
            step: -1,
        };
        const iterator = Executor(iteratorNode, mockContext, mockOptions);
        expect(iterator.keys).toEqual(['2', '1', '0']);
        expect(iterator.next()).toEqual({ "$key": "0", "$value": 3 });
        expect(iterator.next()).toEqual({ "$key": "1", "$value": 1 });
        expect(iterator.next()).toEqual({ "$key": "2", "$value": 2 });
    });

    it('should handle iterator nodes using for', () => {
        const iteratorNode: IteratorNode = {
            type: 'iterator',
            collection: { type: 'literal', value: 10 },
            operator: 'for',
            lookup: { key: '$key' }
        };
        const iterator = Executor(iteratorNode, mockContext, mockOptions);
        expect(iterator.length).toEqual(10);
    });

    it('should handle iterator nodes using an object', () => {
        const iteratorNode: IteratorNode = {
            type: 'iterator',
            collection: { type: 'literal', value: { a: 1, b: 2, c: 3 } },
            operator: 'in',
            lookup: { key: '$key' },
            filter: { type: 'literal', value: true },
            sort: { by: "$key", direction: "asc" },
            step: 1,
        };
        const iterator = Executor(iteratorNode, mockContext, mockOptions);
    });

    it('should handle regex match nodes', () => {
        const matchNode: RegExpMatchNode = {
            type: 'match',
            value: { type: 'literal', value: 'abc123' },
            regexp: { type: 'regex', pattern: /\d+/g },
        };
        const matches = Executor(matchNode, mockContext, mockOptions);
        expect(JSON.stringify([...matches])).toEqual("[[\"123\"]]");
    });

    it('should throw an error for invalid operators', () => {
        const invalidOperatorNode: ConditionalNode = {
            type: 'conditional',
            sideA: { type: 'literal', value: 5 },
            sideB: { type: 'literal', value: 5 },
            operator: 'invalid',
        };
        expect(() => Executor(invalidOperatorNode, mockContext, mockOptions)).toThrow(
            '[Invalid Operator] Unable to locate the operator (invalid)'
        );
    });

    it('should handle quiet mode for missing variables', () => {
        const variableNode: VariableNode = { type: 'variable', path: '$.missing' };
        expect(Executor(variableNode, mockContext, mockOptions)).toBeUndefined();
    });

    it('should throw an error for missing variables in non-quiet mode', () => {
        const variableNode: VariableNode = { type: 'variable', path: '$.missing' };
        expect(() => Executor(variableNode, mockContext, { quiet: false })).toThrow(
            "[Variable not Found] The variable path was not found in the context. (\"$.missing\")"
        );
    });

    it('should throw an error for invalid iterator collections', () => {
        const iteratorNode: IteratorNode = {
            type: 'iterator',
            collection: { type: 'literal', value: 42 },
            operator: 'in',
            lookup: { key: 'key', value: 'value' },
        };
        expect(() => Executor(iteratorNode, mockContext, mockOptions)).toThrow(
            "[Invalid Iterator Collection] The iterator collection must be an object or an array (\"literal\")"
        );
    });

    it('should throw an error for missing functions', () => {
        const executionNode: FuncNode = {
            type: 'execution',
            path: '$.missingFunc',
            arguments: [],
        };
        expect(() => Executor(executionNode, mockContext, mockOptions)).toThrow(
            "[Function not Found] The execution expression's function was not found in the context. ($.missingFunc)"
        );
    });

    it('should throw an error for invalid functions', () => {
        const executionNode: FuncNode = {
            type: 'execution',
            path: '$.badFn',
            arguments: [],
        };
        expect(() => Executor(executionNode, mockContext, mockOptions)).toThrow(
            "[Invalid Function] The execution expression's function value must be a function. ($.badFn string)"
        );
    });

    it('should throw an error for missing functions', () => {
        const executionNode: FuncNode = {
            type: 'execution',
            path: '$.invalidFunc',
            arguments: [],
        };
        expect(() => Executor(executionNode, mockContext, mockOptions)).toThrow(
            "[Function not Found] The execution expression's function was not found in the context. ($.invalidFunc)"
        );
    });

    it('shouldthrow an error for missing bind functions', () => {
        const bindNode: FuncNode = {
            type: 'bind',
            path: '$.missingFn',
            arguments: [{ type: 'literal', value: 21 }],
        };
        expect(() => Executor(bindNode, mockContext, mockOptions)).toThrow(
            "[Function not Found] The execution expression's function was not found in the context. ($.missingFn)"
        );
    });

    it('should throw an error for invalid functions', () => {
        const executionNode: FuncNode = {
            type: 'bind',
            path: '$.badFn',
            arguments: [{ type: 'literal', value: 21 }],
        };
        expect(() => Executor(executionNode, mockContext, mockOptions)).toThrow(
            "[Invalid Function] The execution expression's function value must be a function. ($.badFn string)"
        );
    });

    it('should handle type node', () => {
        const typeNode: TypeNode = {
            type: "type",
            value: "string"
        };
        expect(Executor(typeNode, mockContext, mockOptions)).toEqual("string");
    });

    it('should handle regex node', () => {
        const pattern = /[.]/g;
        const regexNode: RegExpNode = {
            type: "regex",
            pattern
        };
        expect(Executor(regexNode, mockContext, mockOptions)).toEqual(pattern);
    });

    it('should handle OR after last result in chain', () => {
        const chainNode: ChainNode = {
            type: 'chain',
            sections: [
                { type: 'literal', value: {} },
                { type: 'logical', value: '||' },
                { type: 'literal', value: 10 },
            ],
        };
        expect(Executor(chainNode, mockContext, mockOptions)).toEqual({});
    });

    it('should handle AND after last result in chain is falsey', () => {
        const chainNode: ChainNode = {
            type: 'chain',
            sections: [
                { type: 'literal', value: 0 },
                { type: 'logical', value: '&&' },
                { type: 'literal', value: 10 },
                { type: 'logical', value: '||' },
                { type: 'literal', value: 20 },
            ],
        };
        expect(Executor(chainNode, mockContext, mockOptions)).toEqual(20);
    });

    it('should handle AND after last result in chain is falsey without next OR', () => {
        const chainNode: ChainNode = {
            type: 'chain',
            sections: [
                { type: 'literal', value: 0 },
                { type: 'logical', value: '&&' },
                { type: 'literal', value: 10 }
            ],
        };
        expect(Executor(chainNode, mockContext, mockOptions)).toEqual(undefined);
    });

});

describe("Iterator filter on an array (characterisation)", () => {
    // Epic 4 Story 2 (StateUI repeat) relies on this: filtering an array compacts it,
    // so iterator keys are re-indexed and no longer equal the source array indices
    it('should return a compacted array whose keys are re-indexed from "0"', () => {
        // Arrange: the locals aren't $-named and the filter resolves to undefined for dropped items,
        // so this documents behaviour that holds both before and after the AMM-1583 fixes
        const iteratorNode: IteratorNode = {
            type: 'iterator',
            collection: {
                type: 'literal',
                value: [{ id: 'a', keep: 1 }, { id: 'x' }, { id: 'b', keep: 1 }, { id: 'y' }, { id: 'c', keep: 1 }]
            },
            operator: 'in',
            lookup: { key: 'k', value: 'item' },
            filter: { type: 'variable', path: 'item.keep' },
            step: 1
        };

        // Act
        const iterator = Executor(iteratorNode, {}, { quiet: true });

        // Assert
        expect(Array.isArray(iterator.collection)).toBe(true);
        expect(iterator.collection.map((item: { id: string }) => item.id)).toEqual(['a', 'b', 'c']);
        expect(iterator.keys).toEqual(['0', '1', '2']);
        expect(iterator.next().k).toBe('0');
        expect(iterator.next().k).toBe('1');
    });
});

describe("Iterator locals and $-named context keys (AMM-1583)", () => {
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

    it('should read a $-named own property verbatim when quiet is false', () => {
        // Arrange
        const expr = Expression('$v.name');

        // Act
        const result = expr.execute({ $v: { name: 'x' } }, { quiet: false });

        // Assert
        expect(result).toBe('x');
    });

    it('should read a $-named key inherited through the prototype chain', () => {
        // Arrange (iterator rows are Object.create(context) with the locals as own props)
        const row = Object.create({ $v: { name: 'inherited' } });

        // Act
        const result = Expression('$v.name').execute(row, { quiet: false });

        // Assert
        expect(result).toBe('inherited');
    });

    it('should resolve $.a.b, $, a.b and $my.variable as before when no $-named key exists', () => {
        // Arrange
        const context = { a: { b: 1 }, my: { variable: 2 } };

        // Act / Assert
        expect(Expression('$.a.b').execute(context, { quiet: false })).toBe(1);
        expect(Expression('a.b').execute(context, { quiet: false })).toBe(1);
        expect(Expression('$my.variable').execute(context, { quiet: false })).toBe(2);
        expect(Expression('$').execute(context, { quiet: false })).toBe(context);
    });

    it('should prefer the $-named key over the stripped name when both exist', () => {
        // Arrange
        const context = { $v: { name: 'local' }, v: { name: 'global' } };

        // Act
        const result = Expression('$v.name').execute(context, { quiet: false });

        // Assert
        expect(result).toBe('local');
    });

    it('should filter an array collection by an iterator local', () => {
        // Arrange
        const expr = Expression('$k,$i,$v in $.list filter $v.age > 1');

        // Act
        const iterator = expr.execute({ list: people() }, { quiet: false });

        // Assert
        expect(iterator.collection.map((p: { name: string }) => p.name)).toEqual(['Cara', 'Bo']);
        expect(drain(iterator).map((row) => row.$v.name)).toEqual(['Cara', 'Bo']);
    });

    it('should filter an object collection by an iterator local and keep the keys', () => {
        // Arrange
        const expr = Expression('$k,$i,$v in $.list filter $v.age > 1');
        const list = { c: { name: 'Cara', age: 3 }, a: { name: 'Abe', age: 1 }, b: { name: 'Bo', age: 2 } };

        // Act
        const iterator = expr.execute({ list }, { quiet: false });

        // Assert
        expect(iterator.keys).toEqual(['c', 'b']);
        expect(drain(iterator).map((row) => row.$k)).toEqual(['c', 'b']);
    });

    it('should filter by the key local', () => {
        // Arrange
        const expr = Expression("$k,$i,$v in $.list filter $k !== 'a'");
        const list = { a: 1, b: 2, c: 3 };

        // Act
        const iterator = expr.execute({ list }, { quiet: false });

        // Assert
        expect(iterator.keys).toEqual(['b', 'c']);
    });

    it('should iterate every item of an iterator parsed from a string', () => {
        // Arrange (the parser sets no step, so next() must default to a step of 1)
        const expr = Expression('$k,$i,$v in $.list');

        // Act
        const rows = drain(expr.execute({ list: ['a', 'b', 'c'] }, { quiet: false }));

        // Assert
        expect(rows.map((row) => row.$v)).toEqual(['a', 'b', 'c']);
    });

    it('should sort by a path on the value local ascending', () => {
        // Arrange
        const expr = Expression('$k,$i,$v in $.list sort $v.name asc');

        // Act
        const rows = drain(expr.execute({ list: people() }, { quiet: false }));

        // Assert
        expect(rows.map((row) => row.$v.name)).toEqual(['Abe', 'Bo', 'Cara']);
    });

    it('should sort by a path on the value local descending', () => {
        // Arrange
        const expr = Expression('$k,$i,$v in $.list sort $v.name desc');

        // Act
        const rows = drain(expr.execute({ list: people() }, { quiet: false }));

        // Assert
        expect(rows.map((row) => row.$v.name)).toEqual(['Cara', 'Bo', 'Abe']);
    });

    it('should sort by an item property name as before', () => {
        // Arrange
        const asc = Expression('$k,$i,$v in $.list sort age');
        const desc = Expression('$k,$i,$v in $.list sort age desc');

        // Act
        const ascRows = drain(asc.execute({ list: people() }, { quiet: false }));
        const descRows = drain(desc.execute({ list: people() }, { quiet: false }));

        // Assert
        expect(ascRows.map((row) => row.$v.age)).toEqual([1, 2, 3]);
        expect(descRows.map((row) => row.$v.age)).toEqual([3, 2, 1]);
    });

    it('should sort by the value local itself, including falsy values', () => {
        // Arrange
        const asc = Expression('$k,$i,$v in $.list sort $v');
        const desc = Expression('$k,$i,$v in $.list sort $v desc');

        // Act
        const ascRows = drain(asc.execute({ list: [2, 0, 1] }, { quiet: false }));
        const descRows = drain(desc.execute({ list: [2, 0, 1] }, { quiet: false }));

        // Assert
        expect(ascRows.map((row) => row.$v)).toEqual([0, 1, 2]);
        expect(descRows.map((row) => row.$v)).toEqual([2, 1, 0]);
    });

    it('should sort by the index local using positions before sorting', () => {
        // Arrange
        const expr = Expression('$k,$i,$v in $.list sort $i desc');

        // Act
        const rows = drain(expr.execute({ list: ['a', 'b', 'c', 'd'] }, { quiet: false }));

        // Assert
        expect(rows.map((row) => row.$v)).toEqual(['d', 'c', 'b', 'a']);
    });
});
