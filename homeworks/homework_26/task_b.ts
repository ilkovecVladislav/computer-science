import { ParserIterator, take } from "./task_a";

export type ParserResult<T> = [T, ParserIterator];
export type Parser<T> = (input: string | ParserIterator) => ParserResult<T>;

export function whitespace(input: string | ParserIterator) {
  return take(/\s/, { min: 0 })(input);
}

export function tag(tag: Iterable<string | RegExp> | RegExp) {
  const pattern = tag instanceof RegExp ? [tag] : tag;
  return (input: string | ParserIterator) => {
    const iter =
      input instanceof ParserIterator ? input : new ParserIterator(input);
    let result = "";
    for (const test of Iterator.from(pattern).flatMap(flat).map(createTest)) {
      const char = iter.peek();
      if (char == null || !test(char)) {
        throw new Error(`Expected pattern "${[...pattern].join("")}"`);
      }
      result += char;
      iter.next();
    }
    return [result, iter] as const;
  };

  function flat(value: string | RegExp): IterableIterator<string | RegExp> {
    return Iterator.from(typeof value === "string" ? value : ([value] as any));
  }

  function createTest(value: string | RegExp) {
    return typeof value === "string"
      ? (char: string) => char === value
      : (char: string) => value.test(char);
  }
}

export function jsonString(input: string | ParserIterator) {
  const [, iterAfterOpen] = tag('"')(input);
  const [result, iterAfterContent] = take(/[^"]/, { min: 0 })(iterAfterOpen);
  const [, finalIter] = tag('"')(iterAfterContent);

  return [result, finalIter] as const;
}

export function jsonNumber(input: string | ParserIterator) {
  const [sign, afterSign] = take(/-/, { min: 0, max: 1 })(input);
  const [int, afterInt] = take(/\d/, { min: 1 })(afterSign);

  let rawNumber = (sign || "") + int;
  let currentIter = afterInt;

  try {
    const [dot, afterDot] = tag(".")(currentIter);
    const [float, afterFloat] = take(/\d/, { min: 1 })(afterDot);

    rawNumber += (dot || ".") + float;
    currentIter = afterFloat;
  } catch {}

  return [Number(rawNumber), currentIter] as const;
}

export function jsonBoolean(input: string | ParserIterator) {
  try {
    const [, iter] = tag("true")(input);
    return [true, iter] as const;
  } catch {
    const [, iter] = tag("false")(input);
    return [false, iter] as const;
  }
}

export function jsonNull(input: string | ParserIterator) {
  const [, iter] = tag("null")(input);
  return [null, iter] as const;
}

export function jsonArray(input: string | ParserIterator): ParserResult<any[]> {
  const [, iterAfterOpen] = tag("[")(input);
  const [, iterAfterWsOpen] = whitespace(iterAfterOpen);

  try {
    const [, finalIter] = tag("]")(iterAfterWsOpen);
    return [[], finalIter] as const;
  } catch {}

  const result: any[] = [];
  let currentIter = iterAfterWsOpen;

  while (true) {
    const [value, iterAfterValue] = jsonValue(currentIter);
    result.push(value);

    const [, iterAfterWsVal] = whitespace(iterAfterValue);
    currentIter = iterAfterWsVal;

    try {
      const [, iterAfterComma] = tag(",")(currentIter);
      const [, iterAfterWsComma] = whitespace(iterAfterComma);
      currentIter = iterAfterWsComma;
    } catch {
      break;
    }
  }

  const [, finalIter] = tag("]")(currentIter);
  return [result, finalIter] as const;
}

export function jsonObject(
  input: string | ParserIterator,
): ParserResult<Record<string, any>> {
  const [, iterAfterOpen] = tag("{")(input);
  const [, iterAfterWsOpen] = whitespace(iterAfterOpen);

  try {
    const [, finalIter] = tag("}")(iterAfterWsOpen);
    return [{}, finalIter] as const;
  } catch {}

  const result: Record<string, any> = {};
  let currentIter = iterAfterWsOpen;

  while (true) {
    const [key, iterAfterKey] = jsonString(currentIter);
    const [, iterAfterWsKey] = whitespace(iterAfterKey);

    const [, afterColon] = tag(":")(iterAfterWsKey);
    const [, iterAfterWsColon] = whitespace(afterColon);

    const [value, iterAfterValue] = jsonValue(iterAfterWsColon);
    result[key] = value;

    const [, iterAfterWsVal] = whitespace(iterAfterValue);
    currentIter = iterAfterWsVal;

    try {
      const [, iterAfterComma] = tag(",")(currentIter);
      const [, iterAfterWsComma] = whitespace(iterAfterComma);
      currentIter = iterAfterWsComma;
    } catch {
      break;
    }
  }

  const [, finalIter] = tag("}")(currentIter);
  return [result, finalIter] as const;
}

export function jsonValue(input: string | ParserIterator): ParserResult<any> {
  const parsers = [
    jsonString,
    jsonNumber,
    jsonBoolean,
    jsonNull,
    jsonArray,
    jsonObject,
  ];

  for (const parser of parsers) {
    try {
      return parser(input);
    } catch {}
  }

  throw new Error("Expected valid JSON value");
}

export function jsonParse(input: string | ParserIterator) {
  const [, iterAfterWs] = whitespace(input);
  const [result] = jsonValue(iterAfterWs);
  return result;
}

// 1. Базовые типы
console.log(jsonParse('"hello world"')); // "hello world"
console.log(jsonParse("123.45")); // 123.45
console.log(jsonParse("true")); // true
console.log(jsonParse("null")); // null

// 2. Простые структуры
console.log(jsonParse('[1, 2, "three", false, null]'));
// [ 1, 2, 'three', false, null ]

console.log(jsonParse('{"name": "Alice", "age": 30, "isActive": true}'));
// { name: 'Alice', age: 30, isActive: true }

// 3. Сложная вложенность (массив объектов со вложенными структурами)
const complexJSON = `
  [
    {
      "id": 1,
      "tags": ["admin", "user"],
      "metadata": {
        "loginCount": 15,
        "lastActive": null
      }
    },
    {
      "id": 2,
      "tags": ["guest"],
      "metadata": {
        "loginCount": 1,
        "lastActive": "2026-06-06"
      }
    }
  ]
`;

console.log(JSON.stringify(jsonParse(complexJSON), null, 2));
