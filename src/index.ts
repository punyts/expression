import Executor from "./Executor";
import Parser from "./Parser";
import { ExecuteOptions, CompiledExpression } from "./Types";

export default function Expression(expressionStr: string) {
    const tree = Parser(expressionStr);

    return {
        original: expressionStr,
        variables: tree.variables,
        execute: (context: Object, options?: ExecuteOptions) => Executor(tree.node, context, options)
    } as CompiledExpression;
}