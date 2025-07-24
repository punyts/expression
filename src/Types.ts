
export type ParsedNodeType = "array" | "bind" | "concat" | "conditional" | "execution" | "iterator" | "literal" | "logical" | "match" | "not" | "object" | "operator" | "regex" | "type" | "variable" | "chain";

export interface ParsedNode {
    type: ParsedNodeType;
}

export interface OperatorNode extends ParsedNode {
    operator: string;
    expressions: ExpressionNode[];
}

export interface ConcatNode extends ParsedNode {
    expressions: ExpressionNode[];
}

export interface NotNode extends ParsedNode {
    not: string;
    expression: ExpressionNode;
}

export interface RegExpNode extends ParsedNode {
    pattern: RegExp;
}

export interface RegExpMatchNode extends ParsedNode {
    value: any;
    regexp: RegExpNode
}

export interface LiteralNode extends ParsedNode {
    value: any;
}

export interface VariableNode extends ParsedNode {
    path: string;
}

export interface ArrayNode extends ParsedNode {
    members: ExpressionNode[];
}

export interface FuncNode extends ParsedNode {
    path: string;
    arguments: ExpressionNode[];
}

export type SortDirection = "asc" | "desc";

export interface SortType {
    by: string;
    direction: SortDirection;
}

export interface IteratorLookup {
    key: string;
    index?: string;
    value?: string;
}

export interface IteratorNode extends ParsedNode {
    lookup: IteratorLookup;
    operator: string;
    collection: ExpressionNode;
    filter?: ExpressionNode;
    sort?: SortType;
    step?: number;
}

export interface ConditionalNode extends ParsedNode {
    sideA: ExpressionNode;
    operator: string;
    sideB?: ExpressionNode;
}

export interface TypeNode extends ParsedNode {
    value: string;
}

export interface ObjectNode extends ParsedNode {
    properties: Record<string, any>;
}

export interface ChainNode extends ParsedNode {
    sections: ExpressionNode[];
}

export interface LogicalNode extends ParsedNode {
    value: any;
}

export type ExpressionNode = ObjectNode | ChainNode | TypeNode | ConditionalNode | IteratorNode | FuncNode | ArrayNode | VariableNode | LiteralNode | RegExpMatchNode | RegExpNode | NotNode | ConcatNode | OperatorNode;

export interface ExpressionTree {
    node: ExpressionNode;
    variables: string[];
}

export interface ExecuteOptions {
    quiet: boolean;
}

export interface CompiledExpression {
    original: string;
    variables: string[];
    execute: (context: Object, options?: ExecuteOptions) => any;
}