import Executor from "./Executor.js";
import Parser from "./Parser.js";
import { ExecuteOptions, CompiledExpression } from "./Types.js";

export default function Expression(expressionStr: string) {
    const tree = Parser(expressionStr);

    return {
        original: expressionStr,
        variables: tree.variables,
        execute: (context: Object, options?: ExecuteOptions) => Executor(tree.node, context, options)
    } as CompiledExpression;
}