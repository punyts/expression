import Expression from "./index.js";

describe("Execute concat expression", () => {
    const exprStr = "$.labs['8a074a7d-6768-47bc-9573-297752ae0bbc'].components['31742ad4-d3c0-4ec2-8fb4-cbcabaf0bca0'].input.value +++ ' ' +++ $.labs['8a074a7d-6768-47bc-9573-297752ae0bbc'].components['3eab67c0-2bd4-4948-9129-e2204be4a060'].input.value";
    const expr = Expression(exprStr);
    const context = {
        labs: {
            "8a074a7d-6768-47bc-9573-297752ae0bbc": {
                components: {
                    "31742ad4-d3c0-4ec2-8fb4-cbcabaf0bca0": {
                        input: {
                            value: "Lucas"
                        }
                    },
                    "3eab67c0-2bd4-4948-9129-e2204be4a060": {
                        input: {
                            value: "Chen"
                        }
                    }
                }
            }
        }
    }

    const result = expr.execute(context);

    it("should be concatinated", () => {
        expect(result).toBe("Lucas Chen");
    });
});
describe("Execute object literal expressions", () => {
    it("should build an object with an unquoted key", () => {
        expect(Expression("{a:1}").execute({})).toEqual({ a: 1 });
    });

    it("should build an object with a quoted key", () => {
        expect(Expression('{"a":1}').execute({})).toEqual({ a: 1 });
        expect(Expression("{'a b': 'c'}").execute({})).toEqual({ "a b": "c" });
    });

    it("should evaluate expression, string and nested object values", () => {
        const expr = Expression("{a: $.x, b: 'str', c: {d: 2} }");

        expect(expr.execute({ x: 5 })).toEqual({ a: 5, b: "str", c: { d: 2 } });
        expect(expr.variables).toEqual(["$.x"]);
    });

    it("should evaluate array values", () => {
        const expr = Expression("{list: [1, $.y, 'z'], objs: [{a: 1}, {a: 2}] }");

        expect(expr.execute({ y: 2 })).toEqual({ list: [1, 2, "z"], objs: [{ a: 1 }, { a: 2 }] });
    });

    it("should evaluate nested expression values closed with } }", () => {
        const expr = Expression('{"a":{"b":$.a} }');

        expect(expr.execute({ a: "v" })).toEqual({ a: { b: "v" } });
    });

    it("should evaluate operator, conditional and logical values", () => {
        const expr = Expression("{sum: $.n + 1, big: $.n > 2, either: $.f || $.n, label: 'x:' +++ $.n}");

        expect(expr.execute({ n: 3, f: false })).toEqual({ sum: 4, big: true, either: 3, label: "x:3" });
    });

    it("should build an empty object", () => {
        expect(Expression("{}").execute({})).toEqual({});
    });

    it("should reject an entry without a key", () => {
        expect(() => Expression("{a: 1, 2}")).toThrow();
    });
});
