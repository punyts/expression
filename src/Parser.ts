import { 
    ExpressionTree, 
    TypeNode, 
    ExpressionNode, 
    ChainNode, 
    ConditionalNode, 
    IteratorNode, 
    SortDirection, 
    LiteralNode, 
    VariableNode, 
    FuncNode, 
    ArrayNode, 
    ObjectNode, 
    RegExpMatchNode, 
    RegExpNode, 
    NotNode, 
    ConcatNode, 
    OperatorNode,
    LogicalNode,
    TernaryNode
} from "./Types.js";

/**
* A regular expression pattern to match literal expressions
* @property
*/
const BIND_FUNC_PATT = /^\(([^)]+)\) ?=> ?([A-Za-z0-9$.,"`'\[\]_\<\>]+)$/;
/**
* A regular expression pattern to match an unquoted object literal key
* @property
*/
const OBJ_KEY_PATT = /^(?:[A-Za-z_$][A-Za-z0-9_$]*|[0-9]+)$/;
/**
* A regular expression pattern to match a quoted (placeholder) object literal key
* @property
*/
const OBJ_STRING_KEY_PATT = /^"<([0-9]+)>"$/;
/**
* The closing character for each grouping character
* @field
*/
const GROUP_PAIRS: Record<string, string> = {
    "{": "}"
    , "[": "]"
    , "(": ")"
};
/**
* A regular expression pattern to match the "=>" that follows the parentheses of a bind expression
* @property
*/
const BIND_ARROW_PATT = /^\s*=>/;
/**
* A regular expression pattern to match a parenthesised group placeholder
* @property
*/
const GROUP_PLACEHOLDER_PATT = /^<g([0-9]+)>$/;
/**
* A regular expression pattern to match a regular expression literal at the current position
* @property
*/
const REGEXP_LITERAL_PATT = /\/(?:[^\/\\\n]|\\.)+\/[gimyusd]*/y;
/**
* A regular expression pattern to match the character before a "(" that makes it the argument list of a call
* @property
*/
const CALL_PAREN_PATT = /[A-Za-z0-9_$\]]/;
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
const COND_PATT = /^([!\-A-Za-z0-9$.,()\[\]_\ '"`<>]+) (is|!is|isin|!isin|==|>|<|!=|>=|<=|!==|===) ([A-z0-9$.,()\[\]_\\ \/\-'"`<>]+|(?<!\/)\/.+(?<!\/)\/[gimyusd]+|"<[0-9]>"|\[(?:[,]?"<[0-9]>")+\])$/i;
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
const ERROR_INVALID_OBJECT = "[Invalid Object] Object literal entries must be written as key: value";

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
    const value = values[1] ?? values[2] ?? values[3];
    const index = strings.length;
    strings.push(
        value
    );
    return `"<${index}>"`;
}

/**
 * Replaces each parenthesised group with a "<gN>" placeholder, so the operators inside it are never split at the
 * wrong level. The group text is kept in strings, after the string literals, and is parsed as a whole expression
 * where its placeholder is used. The argument list of a call and the arguments of a bind are not groups.
 * @param strings
 * @param expressionStr
 */
function hideGroups(strings: string[], expressionStr: string) {
    let result = "";
    let i = 0;
    while (i < expressionStr.length) {
        const char = expressionStr[i];
        //a regular expression literal may hold parentheses; division is written with spaces around the "/"
        if (char === "/" && !(/\s/.test(expressionStr[i - 1] ?? "") && /\s/.test(expressionStr[i + 1] ?? ""))) {
            REGEXP_LITERAL_PATT.lastIndex = i;
            const literal = REGEXP_LITERAL_PATT.exec(expressionStr);
            if (literal) {
                result += literal[0];
                i += literal[0].length;
                continue;
            }
        }
        if (char === "(" && !CALL_PAREN_PATT.test(expressionStr[i - 1] ?? "")) {
            const end = findGroupEnd(expressionStr, i);
            if (end !== -1 && !BIND_ARROW_PATT.test(expressionStr.substring(end + 1))) {
                strings.push(
                    expressionStr.substring(i + 1, end)
                );
                result += `<g${strings.length - 1}>`;
                i = end + 1;
                continue;
            }
        }
        result += char;
        i++;
    }
    return result;
}

function parse(
        variables: string[],
        strings: string[],
        strippedExpressionStr: string
): ExpressionTree {
    return {
        node: parseNode(
            variables,
            strings,
            hideGroups(
                strings,
                strippedExpressionStr
            )
        ),
        variables
    };
}

/**
 * Parses a whole expression, or an iterator's filter, where "||" and "&&" chains are allowed
 * @param variables
 * @param strings
 * @param expressionStr
 */
function parseNode(variables: string[], strings: string[], expressionStr: string): ExpressionNode {
    //an iterator owns any "||", "&&" or ternary in its filter, so it is matched before they are split
    const iterMatch = expressionStr.match(ITER_PATT);
    if (iterMatch) {
        return parseIterator(
            variables,
            strings,
            iterMatch
        );
    }
    //a ternary has the lowest precedence, so its test and branches may hold "||" and "&&" chains
    const ternary = findTernary(expressionStr);
    if (ternary) {
        return parseTernary(
            variables,
            strings,
            expressionStr,
            ternary
        );
    }
    //an object literal owns any "||" or "&&" in its values
    if (isObjectLiteral(expressionStr)) {
        return parseObject(
            variables,
            strings,
            expressionStr
        );
    }
    //first step is to split any "||" or "&&"
    if (expressionStr.match(HAS_AND_OR_PATT)) {
        return splitLogical(
            variables,
            strings,
            expressionStr
        );
    }
    //otherwise just parse the expression
    return parseExpression(
        variables,
        strings,
        expressionStr
    );
}

function splitLogical(variables: string[], strings: string[], expressionStr: string) {
    const tree: ChainNode = {
        type: "chain",
        sections: []
    };
    //the matches are taken first: a parenthesised group is parsed in the loop and splits its own chain
    for (const match of expressionStr.matchAll(SPLIT_AND_OR_PATT)) {
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
    //a ternary nested in an argument, array member or object value
    const ternary = findTernary(expressionStr);
    if (ternary) {
        return parseTernary(
            variables
            , strings
            , expressionStr
            , ternary
        );
    }
    //an object literal is parsed whole so its values are not split
    else if (isObjectLiteral(expressionStr)) {
        return parseObject(
            variables
            , strings
            , expressionStr
        );
    }
    //see if this has a concatination operation
    else if (expressionStr.match(CONCAT_PATT)) {
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
    //maybe a not pattern; "!" binds tighter than any operator, so it only owns an operand
    else if (!!(match = expressionStr.match(NOT_PATT)) && !hasTopLevelOperator(match[2])) {
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

/**
 * True when the expression has an arithmetic operator outside any group, so a leading "!" is not the whole of it.
 * A literal and a regexp match are operands, even though they may hold "-" or "/"
 * @param expressionStr
 */
function hasTopLevelOperator(expressionStr: string) {
    const trimmed = expressionStr.trim();
    if (LITERAL_PATT.test(trimmed) || MATCH_PATT.test(trimmed)) {
        return false;
    }
    let depth = 0;
    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (GROUP_PAIRS[char]) {
            depth++;
        }
        else if (char === "}" || char === "]" || char === ")") {
            depth--;
        }
        else if (depth === 0 && OPERATOR_PATT.exec(trimmed.substring(i))?.index === 0) {
            return true;
        }
    }
    return false;
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
        treeNode.filter = parseNode(
            variables
            , strings
            , match[8]
        );
    }
    if (!!match[9]) {
        treeNode.step = /[0-9]+([.][0-9]+)?/.test(match[9])
            ? parseInt(
        match[9]
): 1;
    }

    return treeNode;
}

function parseValueExpression(variables: string[], strings: string[], expressionStr: string) {




    let match: RegExpMatchArray | null;
    //remove any leading or trailing whitespace
    expressionStr = expressionStr.trim();
    //a parenthesised group is parsed as a whole expression
    if (!!(match = expressionStr.match(GROUP_PLACEHOLDER_PATT))) {
        return parse(
            variables
            , strings
            , strings[parseInt(match[1])]
        ).node;
    }
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
        else if (isObjectLiteral(expressionStr)) {
            return parseObject(
                variables
                , strings
                , expressionStr
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
    const arrayMemebers = splitTopLevel(value, ",");
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

function parseObject(variables: string[], strings: string[], objectStr: string) {
    const body = objectStr.trim().slice(1, -1);
    const treeNode: ObjectNode = {
        type: "object",
        properties: {}
    };
    //an empty object has no entries
    if (body.trim() === "") {
        return treeNode;
    }
    //process the object entries, each value is an expression
    splitTopLevel(body, ",")
        .forEach(
            function forEachEntry(entryStr, index, entries) {
                //allow a trailing comma
                if (entryStr.trim() === "" && index === entries.length - 1) {
                    return;
                }
                const [keyStr, ...valueParts] = splitTopLevel(entryStr, ":");
                if (valueParts.length === 0) {
                    throw new Error(
                        `${ERROR_INVALID_OBJECT} ("${entryStr.trim()}")`
                    );
                }
                const propName = parseObjectKey(strings, keyStr.trim());
                const expr = parse(
                    variables
                    , strings
                    , valueParts.join(":").trim()
                );
                treeNode.properties[propName] = expr.node;
            }
        );

    return treeNode;
}

function parseObjectKey(strings: string[], keyStr: string) {
    let match: RegExpMatchArray | null;
    if (!!(match = keyStr.match(OBJ_STRING_KEY_PATT))) {
        return strings[parseInt(match[1])];
    }
    if (OBJ_KEY_PATT.test(keyStr)) {
        return keyStr;
    }
    throw new Error(
        `${ERROR_INVALID_OBJECT} ("${keyStr}")`
    );
}

/**
 * True when the "?" or ":" at index stands alone with whitespace on both sides, so "/colou?r/", "{a: 1}" and "??"
 * are never taken for a ternary
 * @param expressionStr
 * @param index
 */
function isSpacedTernaryToken(expressionStr: string, index: number) {
    const before = expressionStr[index - 1];
    const after = expressionStr[index + 1];
    return before !== undefined
        && after !== undefined
        && /\s/.test(before)
        && /\s/.test(after);
}

/**
 * Finds the top-level "?" and its matching ":" of a ternary, outside any group. Strings are already placeholders.
 * The first "?" is the outermost (the test can't contain an unbracketed ternary), and nested ternaries in the
 * consequent are skipped by counting, so "a ? b ? c : d : e" pairs the first "?" with the last ":", while
 * "a ? b : c ? d : e" nests in the alternate (right-associative)
 * @param expressionStr
 */
function findTernary(expressionStr: string) {
    let depth = 0;
    let question = -1;
    let pending = 0;
    for (let i = 0; i < expressionStr.length; i++) {
        const char = expressionStr[i];
        if (GROUP_PAIRS[char]) {
            depth++;
        }
        else if (char === "}" || char === "]" || char === ")") {
            depth--;
        }
        else if (depth !== 0 || !isSpacedTernaryToken(expressionStr, i)) {
            continue;
        }
        else if (char === "?") {
            if (question === -1) {
                question = i;
            }
            else {
                pending++;
            }
        }
        else if (char === ":" && question !== -1) {
            if (pending === 0) {
                return { question, colon: i };
            }
            pending--;
        }
    }
    return null;
}

function parseTernary(variables: string[], strings: string[], expressionStr: string, ternary: { question: number, colon: number }) {
    //each part is parsed like a whole expression, so a "||" or "&&" chain in it stays intact
    const parsePart = (partStr: string) => parse(
        variables
        , strings
        , partStr.trim()
    ).node;
    const treeNode: TernaryNode = {
        type: "ternary",
        test: parsePart(expressionStr.substring(0, ternary.question)),
        consequent: parsePart(expressionStr.substring(ternary.question + 1, ternary.colon)),
        alternate: parsePart(expressionStr.substring(ternary.colon + 1))
    };
    return treeNode;
}

function isObjectLiteral(expressionStr: string) {
    const trimmed = expressionStr.trim();
    return trimmed.startsWith("{")
        && findGroupEnd(trimmed, 0) === trimmed.length - 1;
}

function findGroupEnd(expressionStr: string, openIndex: number) {
    //track the open groups so nested braces and brackets are skipped
    const closers: string[] = [];
    for (let i = openIndex; i < expressionStr.length; i++) {
        const char = expressionStr[i];
        if (GROUP_PAIRS[char]) {
            closers.push(GROUP_PAIRS[char]);
        }
        else if (char === closers[closers.length - 1]) {
            closers.pop();
            if (closers.length === 0) {
                return i;
            }
        }
    }
    return -1;
}

function splitTopLevel(expressionStr: string, separator: string) {
    //split on the separator only where it is outside of any group
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < expressionStr.length; i++) {
        const char = expressionStr[i];
        if (GROUP_PAIRS[char]) {
            depth++;
        }
        else if (char === "}" || char === "]" || char === ")") {
            depth--;
        }
        else if (char === separator && depth === 0) {
            parts.push(expressionStr.substring(start, i));
            start = i + 1;
        }
    }
    parts.push(expressionStr.substring(start));
    return parts;
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