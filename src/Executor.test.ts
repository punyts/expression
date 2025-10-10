import Executor from "./Executor.js";
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
        func: jest.fn((arg) => arg * 2),
        badFn: "badFn"
    };

    const mockOptions = { quiet: true };

    let jsonPathSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonPathSpy = jest.spyOn(require('jsonpath-plus'), 'JSONPath');
    });

    afterEach(() => {
        jsonPathSpy.mockRestore();
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