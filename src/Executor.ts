import { 
    ArrayNode, 
    ChainNode, 
    ConcatNode, 
    ConditionalNode, 
    ExecuteOptions, 
    ExpressionNode, 
    FuncNode, 
    IteratorLookup, 
    IteratorNode, 
    LiteralNode, 
    LogicalNode, 
    NotNode, 
    ObjectNode, 
    OperatorNode, 
    RegExpMatchNode, 
    RegExpNode, 
    TernaryNode, 
    TypeNode, 
    VariableNode 
} from "./Types.js";
import { getType } from "@punyts/core";

const ERROR_INVALID_EXPRESSION_TYPE = "[Invalid Expression Type] The expression type given is not valid.";
const ERROR_INVALID_FUNCTION = "[Invalid Function] The execution expression's function value must be a function.";
const ERROR_FUNCTION_NOT_FOUND = "[Function not Found] The execution expression's function was not found in the context.";
const ERROR_VARIABLE_NOT_FOUND = "[Variable not Found] The variable path was not found in the context.";
const ERROR_INVALID_OPERATOR = "[Invalid Operator] Unable to locate the operator";
const ERROR_INVALID_ITERATOR_COLLECTION = "[Invalid Iterator Collection] The iterator collection must be an object or an array";

const DEFAULT_OPTIONS: ExecuteOptions = {
    quiet: true
}

export default function Executor(expressionTree: ExpressionNode, context: Object, options: ExecuteOptions = DEFAULT_OPTIONS) {
    return handleType(
        expressionTree,
        context,
        options
    );
}

function handleType(
        treeNode: ExpressionNode,
        context: Object,
        options: ExecuteOptions
): any {




    switch (treeNode.type) {
        case "ternary":
            return handleTernary(
                treeNode as TernaryNode,
                context,
                options
            );
        case "chain":
            return handleChain(
                treeNode as ChainNode,
                context,
                options
            );
        case "conditional":
            return handleConditional(
                treeNode as ConditionalNode,
                context,
                options
            );
        case "iterator":
            return handleIterator(
                treeNode as IteratorNode,
                context,
                options
            );
        case "literal":
            return (treeNode as LiteralNode).value;
        case "variable":
            return handleVariable(
                treeNode as VariableNode,
                context,
                options
            );
        case "execution":
            return handleExecution(
                treeNode as FuncNode,
                context,
                options
            );
        case "bind":
            return handleBind(
                treeNode as FuncNode,
                context,
                options
            );
        case "array":
            return handleArray(
                treeNode as ArrayNode,
                context,
                options
            );
        case "object":
            return handleObject(
                treeNode as ObjectNode,
                context,
                options
            );
        case "type":
            return (treeNode as TypeNode).value;
        case "regex":
            return (treeNode as RegExpNode).pattern;
        case "match":
            return handleMatch(
                treeNode as RegExpMatchNode,
                context,
                options
            );
        case "not":
            return handleNot(
                treeNode as NotNode,
                context,
                options
            );
        case "concat":
            return handleConcat(
                treeNode as ConcatNode,
                context,
                options
            );
        case "operator":
            return handleOperator(
                treeNode as OperatorNode,
                context,
                options
            );
        default:
            throw new Error(
                `${ERROR_INVALID_EXPRESSION_TYPE} (${treeNode.type})`
            );
    }
}

function handleChain(treeNode: ChainNode, context: Object, options: ExecuteOptions) {
    const sections = treeNode.sections;

    //"&&" binds tighter than "||", and the result is the value of the last operand evaluated, as in JavaScript
    let result;
    let i = 0;
    while (i < sections.length) {
        //evaluate a run of "&&" operands until one is falsey
        result = handleType(
            sections[i]
            , context
            , options
        );
        while (i + 1 < sections.length && (sections[i + 1] as LogicalNode).value === "&&") {
            if (result) {
                result = handleType(
                    sections[i + 2]
                    , context
                    , options
                );
            }
            i = i + 2;
        }
        //a truthy run ends the chain, otherwise carry on after the "||"
        if (result) {
            return result;
        }
        i = i + 2;
    }
    return result;
}

function handleTernary(treeNode: TernaryNode, context: Object, options: ExecuteOptions) {
    //evaluate only the branch that is taken
    return handleType(treeNode.test, context, options)
        ? handleType(treeNode.consequent, context, options)
        : handleType(treeNode.alternate, context, options);
}

function handleConditional(treeNode: ConditionalNode, context: Object, options: ExecuteOptions) {
    const sideA = handleType(
        treeNode.sideA
        , context
        , options
    );
    const sideB = handleType(
        treeNode.sideB as ExpressionNode
        , context
        , options
    );
    const op = treeNode.operator;

    switch (op) {
        case "==":
            return sideA == sideB;
        case "===":
            return sideA === sideB;
        case "!=":
            return sideA != sideB;
        case "!==":
            return sideA !== sideB;
        case ">":
            return sideA > sideB;
        case ">=":
            return sideA >= sideB;
        case "<":
            return sideA < sideB;
        case "<=":
            return sideA <= sideB;
        case "is":
            return getType(sideA) === sideB;
        case "!is":
            return getType(sideA) !== sideB;
        case "isin": {
            const sideBType = getType(sideB);

            if (sideBType === "regexp") {
                if (typeof sideA !== "string") {
                    return false;
                }
                return (sideB as RegExp).test(sideA);
            }

            if (Array.isArray(sideB)) {
                return sideB.indexOf(sideA) !== -1;
            }

            if (sideB !== null && typeof sideB === "object") {
                return sideA in sideB;
            }

            if (typeof sideB === "string") {
                return sideB.indexOf(String(sideA)) !== -1;
            }

            return false;
        }
        case "!isin": {
            const sideBType = getType(sideB);

            if (sideBType === "regexp") {
                if (typeof sideA !== "string") {
                    return true;
                }
                return !(sideB as RegExp).test(sideA);
            }

            if (Array.isArray(sideB)) {
                return sideB.indexOf(sideA) === -1;
            }

            if (sideB !== null && typeof sideB === "object") {
                return !(sideA in sideB);
            }

            if (typeof sideB === "string") {
                return sideB.indexOf(String(sideA)) === -1;
            }

            return true;
        }
        default:
            throw new Error(
                `${ERROR_INVALID_OPERATOR} (${op})`
            );
    }
}

function handleIterator(treeNode: IteratorNode, context: Object, options: ExecuteOptions) {
    const result = handleType(
        treeNode.collection
        , context
        , options
    );
    const set = treeNode.operator === "in"
        ? result
        : createCollection(
            result
        );
    const sort = !!treeNode.sort
        && treeNode.sort.by;
    const dir = !!treeNode.sort
        && treeNode.sort.direction;
    const filter = treeNode.filter;
    //the parser doesn't set a step, so default to walking forward one item at a time
    const step = treeNode.step ?? 1;

    if (typeof set !== "object")
        throw new Error(
            `${ERROR_INVALID_ITERATOR_COLLECTION} ("${treeNode.collection.type}")`
        );

    const coll = !!filter
        ? filterCollection(
        set,
        filter,
        treeNode.lookup,
        context,
        options
): set;
    const keys = Object.keys(coll);
    let indx = 0;

    //sort if we have a sort
    if (!!sort) {
        //record positions before sorting, since keys is reordered in place while the comparator runs
        const positions = new Map(keys.map((key, position) => [key, position]));
        const { key: keyName, index: indexName, value: valueName } = treeNode.lookup;
        const valuePrefix = !!valueName && `${valueName}.`;

        const sortValue = (key: string) => {
            if (sort === keyName) {
                return key;
            }
            if (sort === indexName) {
                return positions.get(key);
            }
            if (sort === valueName) {
                return coll[key];
            }
            //sort by a path on the item, e.g. "$v.name" reads the item's name
            if (!!valuePrefix && sort.startsWith(valuePrefix)) {
                return lookupPath(sort.slice(valuePrefix.length), coll[key]);
            }
            return lookupPath(sort, coll[key]);
        };

        keys.sort(
            function sortKeys(k1, k2) {
                const k1Val = sortValue(k1);
                const k2Val = sortValue(k2);
                if (k1Val < k2Val) {
                    return dir === "asc"
                        && -1
                        || 1;
                }
                if (k1Val > k2Val) {
                    return dir === "asc"
                        && 1
                        || -1;
                }
                return 0;
            }
        );
    }
    //if the step is negative then reverse the order
    if (step < 0) {
        indx = keys.length - 1;
    }
    //create the iterator
    return Object.create(null, {
        "lookup": {
            "enumerable": true
            , "get": function () {
                return treeNode.lookup;
            }
        }
        , "keys": {
            "enumerable": true
            , "get": function () {
                return keys;
            }
        }
        , "index": {
            "enumerable": true
            , "get": function () {
                return indx;
            }
        }
        , "length": {
            "enumerable": true
            , "get": function () {
                return keys.length;
            }
        }
        , "collection": {
            "enumerable": true
            , "get": function () {
                return coll;
            }
        }
        , "next": {
            "enumerable": true
            , "value": function next() {
                if (indx < keys.length && indx >= 0) {
                    var key = keys[indx]
                    , data = Object.create(context)
                    ;
                    data[treeNode.lookup.key] = key;
                    !!treeNode.lookup.index
                    && (data[treeNode.lookup.index] = indx)
                    ;
                    !!treeNode.lookup.value
                    && (data[treeNode.lookup.value] = coll[key])
                    ;
                    indx += step;
                    return data;
                }
            }
        }
        , "reset": {
            "enumerable": true
            , "value": function reset() {
                indx = 0;
            }
        }
    });
}

function lookupPath(path: string, context: Object) {
    if (typeof path !== "string") {
        return undefined;
    }

    let obj: any = context;
    let remainingPath = path.trim();

    // A $-named first segment ("$v.name") is read verbatim when the context has that key,
    // own or inherited, so iterator locals like $k, $i and $v resolve; otherwise fall back to stripping the "$"
    if (remainingPath.startsWith("$") && !remainingPath.startsWith("$.") && remainingPath !== "$") {
        const firstSegment = remainingPath.match(/^[^.[]+/)![0];
        const isObjectLike = obj !== null && (typeof obj === "object" || typeof obj === "function");
        if (isObjectLike && firstSegment in obj) {
            obj = obj[firstSegment];
            remainingPath = remainingPath.slice(firstSegment.length);
        }
    }

    // Normalize dot and bracket notation into a consistent token list.
    const normalizedPath = remainingPath
        .replace(/^\$\.?/, "")
        .replace(/\[(\d+)\]/g, ".$1")
        .replace(/\[['"]([^'"\]]+)['"]\]/g, ".$1");

    const segments = normalizedPath
        .split(".")
        .filter((segment) => segment.length > 0);

    for (const segment of segments) {
        if (obj == null) {
            return undefined;
        }
        obj = obj[segment];
    }

    return obj;
}

function handleMatch(treeNode: RegExpMatchNode, context: Object, options: ExecuteOptions) {
    const value = handleType(
        treeNode.value
        , context
        , options
    ) as string;

    const matches = value.matchAll(treeNode.regexp.pattern);

    return matches;
}

function createCollection(count: number) {
    var coll = new Array(count).fill("");
    return coll.map(
        function mapColl(val, indx) {
            return `${indx}`;
        }
    );
}

function filterCollection(coll: Record<string | symbol | number, any>, filter: ExpressionNode, vars: IteratorLookup, context: Object, options: ExecuteOptions) {
    const keys = Object.keys(coll)
    const isAr = Array.isArray(coll)
    const filtered: Record<string, any> = isAr && [] || {};

    keys.forEach(
        function forEachKey(key, indx) {
            //create a new object with context as the proto
            const data = Object.create(context);
            //add the vars and values to the new object
            data[vars.key] = key;
            !!vars.index
                && (data[vars.index] = indx);
            !!vars.value
                && (data[vars.value] = coll[key]);
            //resolve the
            const result = handleType(
                filter
                , data
                , options
            );

            //keep the item when the filter is truthy; a false comparison must drop it
            if (!!result) {
                const value = coll[key];
                if (isAr)
                    filtered.push(value);
                else
                    filtered[key] = value;
            }
        }
    );

    return filtered;
}

function handleVariable(treeNode: VariableNode, context: Object, options: ExecuteOptions) {
    const value = lookupPath(treeNode.path, context);
    
    if (value === undefined) {
        //if this is a quiet fail then return undefined
        if (options.quiet === true) {
            return undefined;
        }
        throw new Error(
            `${ERROR_VARIABLE_NOT_FOUND} ("${treeNode.path}")`
        );
    }
    return value;
}

function handleExecution(treeNode: FuncNode, context: Object, options: ExecuteOptions) {
    const fn: Function = lookupPath(treeNode.path, context);

    const args = treeNode.arguments
        .map(function mapArg(arg) {
            return handleType(
                arg
                , context
                , options
            );
        });
    if (!fn) {
        throw new Error(
            `${ERROR_FUNCTION_NOT_FOUND} (${treeNode.path})`
        );
    }
    if (typeof fn !== "function") {
        throw new Error(
            `${ERROR_INVALID_FUNCTION} (${treeNode.path} ${typeof fn})`
        );
    }
    //execute the function
    return fn.apply(null, args);
}

function handleBind(treeNode: FuncNode, context: Object, options: ExecuteOptions) {
    const fn = lookupPath(treeNode.path, context);
    const args = treeNode.arguments
            .map(
                function mapArg(arg) {
                    return handleType(
                        arg
                        , context
                        , options
                    );
                }
            );
    if (!fn) {
        throw new Error(
            `${ERROR_FUNCTION_NOT_FOUND} (${treeNode.path})`
        );
    }
    if (typeof fn !== "function") {
        throw new Error(
            `${ERROR_INVALID_FUNCTION} (${treeNode.path} ${typeof fn})`
        );
    }
    return fn.bind.apply(fn, [null].concat(args));
}

function handleArray(treeNode: ArrayNode, context: Object, options: ExecuteOptions) {
    return treeNode.members
        .map(
            function mapMember(member) {
                return handleType(
                    member,
                    context,
                    options
                );
            }
        );
}

function handleObject(treeNode: ObjectNode, context: Object, options: ExecuteOptions) {
    var obj: Record<string, any> = {};

    Object.keys(treeNode.properties)
        .forEach(
            function forEachProperty(key) {
                const property = treeNode.properties[key]
                const result = handleType(
                    property,
                    context,
                    options
                );
                obj[key] = result;
            }
        );

    return obj;
}

function handleNot(treeNode: NotNode, context: Object, options: ExecuteOptions) {
    var exprResults = handleType(
        treeNode.expression,
        context,
        options
    );

    if (treeNode.not === "!!") {
        return !!exprResults;
    }
    return !exprResults;
}

function handleConcat(treeNode: ConcatNode, context: Object, options: ExecuteOptions) {
    const results = treeNode
        .expressions
        .map(
            function mapExpressionResult(expression) {
                return handleType(
                    expression,
                    context,
                    options
                );
            }
        );
    let concatedValue: any;
        
    //loop through the results, adding each to the value
    results.forEach(
        function concatEachResult(result) {
            if (concatedValue === undefined) {
                concatedValue = result;
            }
            else if (Array.isArray(concatedValue)) {
                concatedValue = concatedValue.concat(
                    result
                );
            }
            else if (Array.isArray(result)) {
                concatedValue = [concatedValue]
                    .concat(
                        result
                    );
            }
            else {
                concatedValue += result;
            }
        }
    );

    return concatedValue;
}

function handleOperator(
        treeNode: OperatorNode,
        context: Object,
        options: ExecuteOptions
): any {




    //execute the expressions
    const resultA = handleType(
        treeNode.expressions[0],
        context,
        options
    )
    const resultB = handleType(
        treeNode.expressions[1],
        context,
        options
    );
    //execute the operator
    switch (treeNode.operator) {
        case "**":
            return resultA ** resultB;
        case "*":
            return resultA * resultB;
        case "/":
            return resultA / resultB;
        case "%":
            return resultA % resultB;
        case "-":
            return resultA - resultB;
        case "+":
            if (Array.isArray(resultA)) {
                return resultA.concat(resultB);
            }
            else if (Array.isArray(resultB)) {
                return [resultA].concat(resultB);
            }
            return resultA + resultB;
        case "<<":
            return resultA << resultB;
        case ">>":
            return resultA >> resultB;
        case ">>>":
            return resultA >>> resultB;
    }
}