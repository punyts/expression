import Parser from "./Parser";
import { ChainNode, ConcatNode, ConditionalNode, FuncNode, IteratorNode, LiteralNode, LogicalNode, NotNode, RegExpMatchNode, RegExpNode, VariableNode } from "./Types";

describe("Parse variable expression", () => {
    const exprStr = "$.labs[\"8a074a7d-6768-47bc-9573-297752ae0bbc\"].components[\"31742ad4-d3c0-4ec2-8fb4-cbcabaf0bca0\"].input.value";
    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(1);
        expect(variables[0]).toBe("$.labs.8a074a7d-6768-47bc-9573-297752ae0bbc.components.31742ad4-d3c0-4ec2-8fb4-cbcabaf0bca0.input.value");
    });

    it("should parse as a variable node", () => {
        expect(nodeTree.node.type).toBe("variable");
        expect((nodeTree.node as VariableNode).path).toBe(exprStr);
    });
});

describe("Parse bind function expression", () => {
    const exprStr = "($.path.to.var, \"literal\")=>$.myFunc";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(2);
        expect(variables[0]).toBe("$.myFunc");
        expect(variables[1]).toBe("$.path.to.var");
    });

    it("should parse as a func node", () => {
        expect(nodeTree.node.type).toBe("bind");
        expect((nodeTree.node as FuncNode).path).toBe("$.myFunc");
        expect((nodeTree.node as FuncNode).arguments.length).toBe(2);
        expect((nodeTree.node as FuncNode).arguments[0].type).toBe("variable");
        expect((nodeTree.node as FuncNode).arguments[1].type).toBe("literal");
    });
});

describe("Parse regExp match expression", () => {
    const exprStr = "$.myvar/^(test)*[ ]regular[-]expression$/";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(1);
        expect(variables[0]).toBe("$.myvar");
    });

    it("should parse as a reg exp match node", () => {
        expect(nodeTree.node.type).toBe("match");
        expect((nodeTree.node as RegExpMatchNode).value.type).toBe("variable");
        expect((nodeTree.node as RegExpMatchNode).regexp.type).toBe("regex");
    });
});

describe("Parse regExp expression", () => {
    const exprStr = "/^(test)*[ ]regular[-]expression$/";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(0);
    });

    it("should parse as a reg exp node", () => {
        expect(nodeTree.node.type).toBe("regex");
        expect((nodeTree.node as RegExpNode).pattern.toString()).toBe("/^(test)*[ ]regular[-]expression$/");
    });
});

describe("Parse chain logical AND and OR expression", () => {
    const exprStr = "$.path.to.myVar && myFunc(10,\"literal\")";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(2);
        expect(variables[0]).toBe("$.path.to.myVar");
        expect(variables[1]).toBe("myFunc");
    });

    it("should parse as a chain", () => {
        expect(nodeTree.node.type).toBe("chain");
        expect((nodeTree.node as ChainNode).sections.length).toBe(3);
        expect((nodeTree.node as ChainNode).sections[0].type).toBe("variable");
        expect((nodeTree.node as ChainNode).sections[1].type).toBe("logical");
        expect((nodeTree.node as ChainNode).sections[2].type).toBe("execution");
    });
});

describe("Parse iterator expression", () => {
    const exprStr = "$x,$y, $z in $.my.list sort $y filter $x > 1 ";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(2);
        expect(variables[0]).toBe("$.my.list");
        expect(variables[1]).toBe("$x");
    });

    it("should parse as an iterator", () => {
        expect(nodeTree.node.type).toBe("iterator");
        expect((nodeTree.node as IteratorNode).lookup.index).toBe("$y");
        expect((nodeTree.node as IteratorNode).lookup.key).toBe("$x");
        expect((nodeTree.node as IteratorNode).lookup.value).toBe("$z");
        expect((nodeTree.node as IteratorNode).operator).toBe("in");
        expect((nodeTree.node as IteratorNode).sort?.by).toBe("$y");
        expect((nodeTree.node as IteratorNode).filter?.type).toBe("conditional");
    });
});

describe("Parse conditional expression", () => {
    const exprStr = "$my.variable === 100";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(1);
        expect(variables[0]).toBe("$my.variable");
    });

    it("should parse as a conditional", () => {
        expect(nodeTree.node.type).toBe("conditional");
        expect((nodeTree.node as ConditionalNode).operator).toBe("===");
        expect((nodeTree.node as ConditionalNode).sideA.type).toBe("variable");
        expect((nodeTree.node as ConditionalNode).sideB?.type).toBe("literal");
    });
});

describe("Parse not expression", () => {
    const exprStr = "!$my.variable";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(1);
        expect(variables[0]).toBe("$my.variable");
    });

    it("should parse as an not", () => {
        expect(nodeTree.node.type).toBe("not");
        expect((nodeTree.node as NotNode).not).toBe("!");
        expect((nodeTree.node as NotNode).expression.type).toBe("variable");
    });
});

describe("Parse concat expression", () => {
    const exprStr = "$.my.var[2] +++ $.global.text +++ ' ' +++ $.path.to.var[\"literal\"]";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(3);
        expect(variables[0]).toBe("$.my.var.2");
        expect(variables[1]).toBe("$.global.text");
        expect(variables[2]).toBe("$.path.to.var.literal");
    });

    it("should parse as a concat", () => {
        expect(nodeTree.node.type).toBe("concat");
        expect((nodeTree.node as ConcatNode).expressions.length).toBe(4);
        expect((nodeTree.node as ConcatNode).expressions[0].type).toBe("variable");
        expect((nodeTree.node as ConcatNode).expressions[2].type).toBe("literal");
        expect(((nodeTree.node as ConcatNode).expressions[2] as LiteralNode).value).toBe(" ");
    });
});

describe("Parse variable expression w/ variable indexer", () => {
    const exprStr = "$.my.var[$.path.to.val].next[$.nextval]";

    const nodeTree = Parser(exprStr);
    const variables = nodeTree.variables;

    it("should parse variables", () => {
        expect(variables.length).toBe(6);
        expect(variables[0]).toBe("$.path.to.val");
        expect(variables[1]).toBe("$.nextval");
        expect(variables[2]).toBe("$.my.var.$every.next.$every");
        expect(variables[3]).toBe("$.my.var.$every");
        expect(variables[4]).toBe("$.my.var");
        expect(variables[5]).toBe("$.my.var.$every.next");
    });

    it("should parse as an iterator", () => {
        expect(nodeTree.node.type).toBe("variable");
    });
});

describe('Parser', () => {
    describe('Basic Parsing', () => {
        it('should parse a simple literal expression', () => {
            const result = Parser("'Hello World'");
            expect(result).toEqual({
                node: {
                    type: 'literal',
                    value: 'Hello World',
                },
                variables: [],
            });
        });

        it('should parse a numeric literal', () => {
            const result = Parser('42');
            expect(result).toEqual({
                node: {
                    type: 'literal',
                    value: 42,
                },
                variables: [],
            });
        });

        it('should parse a boolean literal', () => {
            const result = Parser('true');
            expect(result).toEqual({
                node: {
                    type: 'literal',
                    value: true,
                },
                variables: [],
            });
        });

        it('should parse undefined literal', () => {
            const result = Parser('undefined');
            expect(result).toEqual({
                node: {
                    type: 'literal',
                    value: undefined,
                },
                variables: [],
            });
        });
    });

    describe('Logical Expressions', () => {
        it('should parse logical AND expressions', () => {
            const result = Parser('true && false');
            expect(result).toEqual({
                node: {
                    type: 'chain',
                    sections: [
                        { type: 'literal', value: true },
                        { type: 'logical', value: '&&' },
                        { type: 'literal', value: false },
                    ],
                },
                variables: [],
            });
        });

        it('should parse logical OR expressions', () => {
            const result = Parser('true || false');
            expect(result).toEqual({
                node: {
                    type: 'chain',
                    sections: [
                        { type: 'literal', value: true },
                        { type: 'logical', value: '||' },
                        { type: 'literal', value: false },
                    ],
                },
                variables: [],
            });
        });
    });

    describe('Conditional Expressions', () => {
        it('should parse conditional expressions with comparison operators', () => {
            const result = Parser('a > 5');
            expect(result).toEqual({
                node: {
                    type: 'conditional',
                    sideA: { type: 'variable', path: 'a' },
                    operator: '>',
                    sideB: { type: 'literal', value: 5 },
                },
                variables: ['a'],
            });
        });

        it('should parse conditional expressions with "is" operator', () => {
            const result = Parser('a is [string]');
            expect(result).toEqual({
                node: {
                    type: 'conditional',
                    sideA: { type: 'variable', path: 'a' },
                    operator: 'is',
                    sideB: { type: 'type', value: 'string' },
                },
                variables: ['a'],
            });
        });
    });

    describe('Iterator Expressions', () => {
        it('should parse iterator expressions with "in"', () => {
            const result = Parser('item in collection');
            expect(result).toEqual({
                node: {
                    type: 'iterator',
                    lookup: { key: 'item' },
                    operator: 'in',
                    collection: { type: 'variable', path: 'collection' },
                },
                variables: ['collection'],
            });
        });

        it('should parse iterator expressions with "for"', () => {
            const result = Parser('key, value for object');
            expect(result).toEqual({ "node": { "collection": { "path": "object", "type": "variable" }, "lookup": { "index": "value", "key": "key" }, "operator": "for", "type": "iterator" }, "variables": ["object"] });
        });
    });

    describe('Function Calls', () => {
        it('should parse function calls with arguments', () => {
            const result = Parser('myFunc(42, "hello")');
            expect(result).toEqual({
                node: {
                    type: 'execution',
                    path: 'myFunc',
                    arguments: [
                        { type: 'literal', value: 42 },
                        { type: 'literal', value: 'hello' },
                    ],
                },
                variables: ['myFunc'],
            });
        });

        it('should parse bind function expressions', () => {
            const result = Parser('(x) => myFunc');
            expect(result).toEqual({
                node: {
                    type: 'bind',
                    path: 'myFunc',
                    arguments: [{ type: 'variable', path: 'x' }],
                },
                variables: ['myFunc', 'x'],
            });
        });
    });

    describe('Array and Object Literals', () => {
        it('should parse array literals', () => {
            const result = Parser('[1, 2, 3]');
            expect(result).toEqual({
                node: {
                    type: 'array',
                    members: [
                        { type: 'literal', value: 1 },
                        { type: 'literal', value: 2 },
                        { type: 'literal', value: 3 },
                    ],
                },
                variables: [],
            });
        });

        it('should parse object literals', () => {
            const result = Parser('{ "key": "value" }');
            expect(result).toEqual({ "node": { "properties": { "key": { "node": { "path": "value", "type": "variable" }, "variables": ["value"] } }, "type": "object" }, "variables": ["value"] });
        });
    });

    describe('Regular Expressions', () => {
        it('should parse regular expressions', () => {
            const result = Parser('/abc/g');
            expect(result).toEqual({
                node: {
                    type: 'regex',
                    pattern: /abc/g,
                },
                variables: [],
            });
        });

        it('should parse regular expression match patterns', () => {
            const result = Parser('str /abc/g');
            expect(result).toEqual({
                node: {
                    type: 'match',
                    value: { type: 'variable', path: 'str' },
                    regexp: { type: 'regex', pattern: /abc/g },
                },
                variables: ['str'],
            });
        });
    });

    describe('Error Handling', () => {
        it('should throw an error for invalid expressions', () => {
            expect(() => Parser('$k in [1, 2, 3] filter $k sort $k')).toThrow(
                "[Invalid Expression] The expression does not fit any expression patterns. (\"$k sort $k\")"
            );
        });

        it('should throw an error for invalid operators', () => {
            expect(() => Parser('a @ b')).toThrow(
                "[Invalid Expression] The expression does not fit any expression patterns. (\"a @ b\")"
            );
        });
    });

    describe('Complex Expressions', () => {
        it('should parse concatenated expressions', () => {
            const result = Parser('"Hello" +++ "World"');
            expect(result).toEqual({
                node: {
                    type: 'concat',
                    expressions: [
                        { type: 'literal', value: 'Hello' },
                        { type: 'literal', value: 'World' },
                    ],
                },
                variables: [],
            });
        });

        it('should parse nested expressions', () => {
            const result = Parser('a > 5 && b < 10');
            expect(result).toEqual({
                node: {
                    type: 'chain',
                    sections: [
                        {
                            type: 'conditional',
                            sideA: { type: 'variable', path: 'a' },
                            operator: '>',
                            sideB: { type: 'literal', value: 5 },
                        },
                        { type: 'logical', value: '&&' },
                        {
                            type: 'conditional',
                            sideA: { type: 'variable', path: 'b' },
                            operator: '<',
                            sideB: { type: 'literal', value: 10 },
                        },
                    ],
                },
                variables: ['a', 'b'],
            });
        });
    });
});