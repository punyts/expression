import { getGenericType, isNumeric } from "../utils/RuntimeTypeCheck";
import { ExpressionTree, TypeNode, ExpressionNode, ChainNode, ConditionalNode, IteratorNode, SortDirection, LiteralNode, VariableNode, FuncNode, ArrayNode, ObjectNode, RegExpMatchNode, RegExpNode, NotNode, ConcatNode, OperatorNode, LogicalNode } from "./Types";

/**
* A regular expression pattern to match literal expressions
* @property
*/
const BIND_FUNC_PATT = /^\(([^)]+)\) ?=> ?([A-Za-z0-9$.,"`'\[\]_\<\>]+)$/;
/**
* A regular expression pattern to match object patterns in expressions
* @property
*/
const OBJ_PATT = /^\{.*\}$/;
/**
* A regular expression pattern to match array patterns in expressions
* @property
*/
const ARRAY_PATT = /^\[(.*)\]$/;
/**
* A regular expression pattern to match type patterns in expressions
* @property
*/
const TYPE_PATT = /^\[([a-z]+)\]$/;
/**
* A regular expression pattern for matching the regexp pattern
* @property
*/
const REGEXP_PATT = /^(?<!\/)\/(.+)(?<!\/)\/([gimyusd]*)$/;
/**
* A regular expression pattern for matching a regexp match pattern
* @property
*/
const MATCH_PATT = /^([\-A-Za-z0-9$.,()\[\]_\ '"`]+)(?:(?<!\/)\/(.+)(?<!\/)\/([gimyusd]*))$/;
/**
* A regular expression pattern for matching not and not not
* @property
*/
const NOT_PATT = /^([!]{1,2})(.+)$/;
/**
* A regular expression pattern to match conditional expressions
* @property
*/
const COND_PATT = /^([\-A-Za-z0-9$.,()\[\]_\ '"`<>]+) (is|!is|isin|!isin|==|>|<|!=|>=|<=|!==|===) ([A-z0-9$.,()\[\]_\\ \/\-'"`<>]+|(?<!\/)\/.+(?<!\/)\/[gimyusd]+|"<[0-9]>"|\[(?:[,]?"<[0-9]>")+\])$/i;
/**
* A regular expression pattern to match iterator expressions
* @property
*/
const ITER_PATT = /^([A-Za-z0-9$_]+)(?:, ?([A-Za-z0-9$_]+))?(?:, ?([A-Za-z0-9$_]+))? (in|for) (.+?)(?: sort ([A-z0-9$._\[\]]+)(?: (desc|asc))?)?(?: filter (.+))?$/i;
/**
* A regular expression pattern to match literal expressions
* @property
*/
const LITERAL_PATT = /^(?:'[^']*'|"[^"]*"|`[^`]*`|[-]?(?:0b[0-1]+|0x[0-9a-f]+|0o[0-8]+|[0-9]+(?:[.][0-9]+)?(?:e[-]?[0-9]+)?|Infinity)|true|false|null|undefined)$/;
/**
* A regular expression pattern to match string literal expressions
* @property
*/
const STRING_PATT = /(?<![\\])[']((?:[^']|[\\'])*?)(?<![\\])[']|(?<![\\])[`]((?:[^`]|[\`])*?)(?<![\\])[`]|(?<![\\])["]((?:[^"]|[\\"])*?)(?<![\\])["]/g;
/**
* A regular expression pattern to match string literal placeholders
* @property
*/
const STRING_PLACEHOLDER_PATT = /(?<![<\\])[<]([0-9]+)(?<![<\\])[>]/g;
/**
* A regular expression pattern to match string literal placeholders
* @property
*/
const OBJ_ARRAY_PLACEHOLDER_PATT = /(?<![<\\])[<]{2}([0-9]+)(?<![<\\])[>]{2}/;
/**
* A regular expression pattern to split the concat expression
* @property
*/
const CONCAT_PATT = /[+]{3}/g;
/**
* A regular expression pattern to match function patterns in expressions.
* @property
*/
const FUNC_PATT = /^([A-Za-z0-9$.,()'"`\[\]_\<\>]+) ?\(([^)]+)?\)$/;
/**
* A regular expression pattern to match logical 'OR' or "AND" expressions
* @property
*/
const HAS_AND_OR_PATT = /\&{2}|\|{2}/;
/**
* A regular expression pattern to split logical 'OR' or "AND" expressions
* @property
*/
const SPLIT_AND_OR_PATT = /(.+?) ?(\&{2} ?|\|{2} ?|$)/g;
/**
* A regular expression pattern to test for a variable path
* @property
*/
const VAR_PATT = /^[A-z0-9._$\[\]"'`\<\>]+$/;
/**
* A regular expression pattern to replace array or oject patterns
* @property
*/
const ARRAY_OBJ_PATT = /((?:\[(.*)\])|(?:\{.*\}))/g;
/**
* A regular expression pattern to replace indexer patterns
* @property
*/
const INDXR_PATT = /\[(.+?)\]/g;
/**
* A regular expression pattern to find operators
* @property
*/
const OPERATOR_PATT = /(?<![\\])(?:[+\-*/%&|~^]|[*]{2}|[>]{2}|[<]{2}|[>]{3})(?![ ]*[=])/;
/**
* A list of operators in reverse order of precendence
* @field
*/
const operatorPrecedence: Record<string, RegExp> = {
    ">>>": /(?<![\\])[>]{3}/
    , ">>": /(?<![\\])[>]{2}(?![>])/
    , "<<": /(?<![\\])[<]{2}/
    , "-": /(?<![\\])[-]/
    , "+": /(?<![\\])[+]/
    , "%": /(?<![\\])[%]/
    , "/": /(?<![\\])[\/]/
    , "*": /(?<![\\*])[*](?![*])/
    , "**": /(?<![\\])[*]{2}/
};

const ERROR_INVALID_EXPRESSION = "[Invalid Expression] The expression does not fit any expression patterns.";
const ERROR_INVALID_OPERATOR = "[Invalid Operator] Unable to locate the operator";

export default function Parser(expressionStr: string) {
    const variables: string[] = [];
    //a container to hold the string literals
    const strings: string[] = [];
    //remove string literals so we don't match anything in their contents
    const strippedExpressionStr = expressionStr.replace(
        STRING_PATT,
        removeStrings.bind(
            null
            , strings
        )
    );
    return parse(
        variables,
        strings,
        strippedExpressionStr
    );
}

function removeStrings(strings: string[], ...values: string[]) {
    const value = getGenericType(values[1]) !== "nil"
        ? values[1]
        : getGenericType(values[2]) !== "nil"
            ? values[2]
            : values[3];
    const index = strings.length;
    strings.push(
        value
    );
    return `"<${index}>"`;
}

function parse(variables: string[], strings: string[], strippedExpressionStr: string): ExpressionTree {
    let node: ExpressionNode;
    //first step is to split any "||" or "&&"
    if (strippedExpressionStr.match(HAS_AND_OR_PATT)) {
        node = splitLogical(
            variables,
            strings,
            strippedExpressionStr
        );
    }
    //otherwise just parse the expression
    else {
        node = parseExpression(
            variables,
            strings,
            strippedExpressionStr
        );
    }

    return {
        node,
        variables
    };
}

function splitLogical(variables: string[], strings: string[], expressionStr: string) {
    const tree: ChainNode = {
        type: "chain",
        sections: []
    };
    let match: RegExpExecArray | null;
    while ((match = SPLIT_AND_OR_PATT.exec(expressionStr)) !== null) {
        const node = parseExpression(
            variables,
            strings,
             match[1].trim()
        );
        tree.sections.push(
            node
        );

        const logical: LogicalNode = {
            type: "logical",
            value: match[2].trim()
        }

        tree.sections.push(logical);
    }

    //if the last member is a logical, then remove it
    if (tree.sections[tree.sections.length - 1].type === "logical") {
        tree.sections.pop();
    }

    return tree;
}

function parseExpression(variables: string[], strings: string[], expressionStr: string) {
    var match;
    //see if this has a concatination operation
    if (expressionStr.match(CONCAT_PATT)) {
        return parseConcat(
            variables
            , strings
            , expressionStr
        );
    }
    //see if this is an iterator
    else if (!!(match = expressionStr.match(ITER_PATT))) {
        return parseIterator(
            variables
            , strings
            , match
        );
    }
    //maybe a conditional statement
    else if (!!(match = expressionStr.match(COND_PATT))) {
        return parseConditional(
            variables
            , strings
            , match
        );
    }
    //perhaps a regexp match
    else if (!!(match = expressionStr.match(MATCH_PATT))) {
        return parseRegExpMatch(
            variables
            , strings
            , match[1]
            , match[2]
            , match[3]
        );
    }
    //maybe a not pattern
    else if (!!(match = expressionStr.match(NOT_PATT))) {
        return parseNot(
            variables
            , strings
            , match[1]
            , match[2]
        );
    }
    //otherwise its a value expression
    else {
        return parseValueExpression(
            variables
            , strings
            , expressionStr
        );
    }
}

function parseConditional(variables: string[], strings: string[], match: RegExpMatchArray) {
    let typeMatch;
    const treeNode: ConditionalNode = {
        type: "conditional",
        sideA: parseExpression(
            variables,
            strings,
            match[1]
        ),
        operator: match[2]
    };

    if ((typeMatch = match[3].match(TYPE_PATT))) {
        treeNode.sideB = {
            type: "type",
            value: typeMatch[1]
        } as TypeNode;
    }
    else {
        treeNode.sideB = parseExpression(
            variables,
            strings,
            match[3]
        );
    }

    return treeNode;
}

function parseIterator(variables: string[], strings: string[], match: RegExpMatchArray) {
    var treeNode: IteratorNode = {
        "type": "iterator",
        lookup: {
            "key": match[1]
        },
        operator: match[4],
        collection: parseExpression(
            variables
            , strings
            , match[5]
        )
    };
    if (!!match[2]) {
        treeNode.lookup.index = match[2];
    }
    if (!!match[3]) {
        treeNode.lookup.value = match[3];
    }
    if (!!match[6]) {
        treeNode.sort = {
            by: match[6],
            direction: (match[7] || "asc") as SortDirection
        }
    }
    if (!!match[8]) {
        treeNode.filter = parseExpression(
            variables
            , strings
            , match[8]
        );
    }
    if (!!match[9]) {
        treeNode.step = isNumeric(match[9])
            && parseInt(match[9])
            || 1
            ;
    }

    return treeNode;
}

function parseValueExpression(variables: string[], strings: string[], expressionStr: string) {
    let match: RegExpMatchArray | null;
    //remove any leading or trailing whitespace
    expressionStr = expressionStr.trim();
    //see if this is a literal
    if (LITERAL_PATT.test(expressionStr)) {
        expressionStr = expressionStr.replace(
            STRING_PLACEHOLDER_PATT,
            (_, stringIndex) => {
                const index = parseInt(stringIndex);
                return strings[index];
            }
        );
        return {
            "type": "literal"
            , "value": expressionStr === "undefined"
                ? undefined
                : safeEval(expressionStr) //eval so string delimiters are removed
        } as LiteralNode;
    }
    //not a literal, should be a data value
    else {
        //see if this is a function
        if (!!(match = expressionStr.match(FUNC_PATT))) {
            return parsefunc(
                variables
                , strings
                , match
            );
        }
        //or an array literal
        else if (!!(match = expressionStr.match(ARRAY_PATT))) {
            return parseArray(
                variables
                , strings
                , match[1]
            );
        }
        //or a bind operation
        else if (!!(match = expressionStr.match(BIND_FUNC_PATT))) {
            return parseBindFunc(
                variables
                , strings
                , match
            );
        }
        //or an object literal
        else if (!!(match = expressionStr.match(OBJ_PATT))) {
            return parseObject(
                variables
                , strings
                , match[0]
            );
        }
        //or regular expressions
        else if (!!(match = expressionStr.match(REGEXP_PATT))) {
            return parseRegExp(
                variables
                , match[1]
                , match[2]
            );
        }
        //see if this has any operators in it
        else if (expressionStr.match(OPERATOR_PATT)) {
            return parseOperator(
                variables
                , strings
                , expressionStr
            );
        }
        //or a variable path
        else if (!!expressionStr.match(VAR_PATT)) {
            const variable = expressionStr.replace(
                STRING_PLACEHOLDER_PATT,
                (_, stringIndex) => {
                    const index = parseInt(stringIndex);
                    return strings[index];
                }
            );
            addVariables(
                variables
                , variable
            );
            const node = {
                "type": "variable"
                , "path": variable
            } as VariableNode;

            return node;
        }
        else {
            throw new Error(
                `${ERROR_INVALID_EXPRESSION} ("${expressionStr}")`
            );
        }
    }
}

function parsefunc(variables: string[], strings: string[], match: RegExpMatchArray) {
    var treeNode: FuncNode = {
        type: "execution",
        path: replaceStringPlaceholders(strings, match[1]),
        arguments: []
    }
    , args = extractArguments(
        match[2]
    );
    //add the function name/path to the variables
    addVariables(
        variables
        , match[1]
    );

    args.forEach(
        function parseEachArg(arg) {
            var expr = parseExpression(
                variables
                , strings
                , arg
            );
            treeNode.arguments.push(
                expr
            );
        }
    );

    return treeNode;
}

function parseBindFunc(variables: string[], strings: string[], match: RegExpMatchArray) {
    const treeNode: FuncNode = {
        type: "bind",
        path: replaceStringPlaceholders(strings, match[2]),
        arguments: []
    };
    const args = extractArguments(
        match[1]
    );

    addVariables(
        variables
        , treeNode.path
    );
    //parse the arguments
    args.forEach(
        function parseEachArg(arg) {
            var expr = parseExpression(
                variables
                , strings
                , arg
            );
            treeNode.arguments.push(
                expr
            );
        }
    );

    return treeNode;
}

function extractArguments(expression: string) {
    if (!expression) {
        return [];
    }
    //split out anything with commas in it
    const parts: Record<string, any> = {};
    let cnt = 0;
    const exprNoObjNoArray = expression.replace(
        ARRAY_OBJ_PATT
        , function replaceArray(match, obj) {
            var name = `<<${++cnt}>>`;
            parts[name] = obj;
            return name;
        }
    );
    const args = exprNoObjNoArray.split(",");
    //loop through the args and update any replaced parts
    return args
        .map(
            function mapArgs(arg) {
                arg = arg.trim();
                arg = arg.replace(
                    OBJ_ARRAY_PLACEHOLDER_PATT
                    , function replacePlacholder(match) {
                        return parts[match];
                    }
                );
                return arg;
            }
        );
}

function parseArray(variables: string[], strings: string[], value: string) {
    const arrayMemebers = value.split(",");
    const treeNode: ArrayNode = {
        type: "array",
        members: []
    };

    //loop through the members, parsing each one
    arrayMemebers.forEach(
        function forEachMember(memberStr) {
            var expr = parseExpression(
                variables
                , strings
                , memberStr
            );
            treeNode.members.push(
                expr
            );
        }
    )

    return treeNode;

}

function parseObject(variables: string[], strings: string[], json: string) {
    const valueObj = JSON.parse(json)
    const treeNode: ObjectNode = {
        type: "object",
        properties: {}
    };
    //process the object properties, they could be expressions also
    Object.keys(valueObj)
        .forEach(
            function forEachKey(key) {
                const value = valueObj[key];
                const keyIndex = key.matchAll(STRING_PLACEHOLDER_PATT).next()?.value?.[1] as unknown as string;
                const propMatch = value.matchAll(STRING_PLACEHOLDER_PATT).next()?.value;
                const propIndex = !!propMatch
                    && propMatch[1];
                const propName = strings[parseInt(keyIndex)];
                const propValue = !!propMatch
                    ? strings[propIndex]
                    : value;

                const expr = parse(
                    variables
                    , strings
                    , propValue
                );
                treeNode.properties[propName] = expr;
            }
        );

    return treeNode;
}

function parseRegExpMatch(variables: string[], strings: string[], lookup: string, pattern: string, flags: string) {
    var treeNode: RegExpMatchNode = {
        "type": "match"
        , "value": parseValueExpression(
            variables
            , strings
            , lookup
        )
        , "regexp": parseRegExp(
            variables
            , pattern
            , flags
        )
    };

    return treeNode;
}

function parseRegExp(variables: string[], regExpStr: string, flags: string) {
    var treeNode: RegExpNode = {
        type: "regex",
        pattern: new RegExp(regExpStr, flags)
    };

    return treeNode;
}

function parseNot(variables: string[], strings: string[], not: string, expressionStr: string) {
    var treeNode: NotNode = {
        type: "not",
        not: not,
        expression: parseExpression(
            variables
            , strings
            , expressionStr
        )
    };

    return treeNode;
}

function parseConcat(variables: string[], strings: string[], expressionStr: string) {
    var treeNode: ConcatNode = {
        type: "concat",
        expressions: expressionStr
            .split(CONCAT_PATT)
            .map(
                parseExpression.bind(
                    null
                    , variables
                    , strings
                )
            )
    };

    return treeNode;
}

function parseOperator(variables: string[], strings: string[], expressionStr: string) {
    //find the operator with the highest precendent
    const operator =
        Object.keys(operatorPrecedence)
            .find(
                function findOperator(op) {
                    var regExp = operatorPrecedence[op];
                    return expressionStr.match(regExp);
                }
        );
    if (!operator)
        throw new Error(`${ERROR_INVALID_OPERATOR}`);

    const opIndex = expressionStr.lastIndexOf(operator);

    //create the tree node
    const treeNode: OperatorNode = {
        type: "operator",
        operator,
        //split the expression by the highest order operator
        expressions: [
                expressionStr
                    .substring(0, opIndex)
                    .trim(),
                expressionStr
                    .substring(opIndex + operator.length)
                    .trim()
            ].map(
                parseExpression.bind(
                    null
                    , variables
                    , strings
                )
            )
    };

    return treeNode;
}

function addVariables(variables: string[], variableStr: string) {
    //if there are brackets see if the contents are a varaible
    const mainVar = variableStr.replace(
        INDXR_PATT, 
        replaceIndexer.bind(
            null
            , variables
        )
    );
    
    //if the result of updating indexers makes a different string, use that
    if (mainVar !== variableStr) {
        variables.push(mainVar);
        //add a variable for each $every segment
        mainVar.split(".")
            .forEach(
                function forEachPart(part, index, parts) {
                    if (part === "$every") {
                        //add the variable with the every
                        addVariable(
                            variables
                            , parts
                                .slice(0, index + 1)
                                .join(".")
                        );
                        //add the variable without the $every
                        addVariable(
                            variables
                            , parts
                                .slice(0, index)
                                .join(".")
                        );
                    }
                }
            );
    }
    else {
        addVariable(
            variables
            , mainVar
        );
    }
}

function replaceIndexer(variables: string[], match: string, indexer: string) {
    if (`${indexer}`.match(LITERAL_PATT)) {
        indexer = indexer.replace(/[""]/g, "");
        return `.${indexer}`;
    }
    addVariables(
        variables
        , indexer
    );
    return ".$every";
}

function addVariable(variables: string[], value: any) {
    if (variables.indexOf(value) === -1) {
        variables.push(
            value
        );
    }
}

function safeEval(expressionStr: string) {
    return Function("window", "document", "fetch", "XMLHttpRequest", "Function", `return ${expressionStr}`)();
}

function replaceStringPlaceholders(strings: string[], expressionStr: string) {
    return expressionStr.replace(
        STRING_PLACEHOLDER_PATT,
        (_, stringIndex) => {
            const index = parseInt(stringIndex);
            return strings[index];
        }
    );
}