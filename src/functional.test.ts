import Expression from ".";

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