function zipStr(string) {
  const regExp = /(.)\1+/g;
  return string.replaceAll(regExp, "$1");
}

console.log(zipStr("abbaabbafffbezza"));

function format(target, value) {
  const regExp = /\${(\w+)}/g;

  return target.replaceAll(regExp, (_, key) => {
    return value[key];
  });
}

console.log(
  format("Hello, ${user}! Your age is ${age}.", { user: "Bob", age: 10 }),
);

const MATH_EXPRESSION_REGEX = /(\d+)\s*(\+|\-|\*|\/|\*\*)\s*(\d+)/;

function calculator(a, b, operand) {
  const numA = Number(a);
  const numB = Number(b);
  switch (operand) {
    case "+":
      return numA + numB;
    case "-":
      return numA - numB;
    case "*":
      return numA * numB;
    case "/":
      return numA / numB;
    case "**":
      return numA ** numB;
    default:
      throw new Error("Unsupported operation");
  }
}

function solve(expr) {
  const match = expr.match(MATH_EXPRESSION_REGEX);
  return calculator(match[1], match[3], match[2]);
}

function processBrackets(string) {
  const bracketsRegExp = /\([^()]*\)/g;
  return string.replaceAll(bracketsRegExp, (match) => {
    return solve(match.slice(1, -1));
  });
}

function calc(string) {
  let result = string;

  while (result.includes("(")) {
    result = processBrackets(result);
  }

  const globalMathRegex = new RegExp(MATH_EXPRESSION_REGEX.source, "g");

  result = result.replaceAll(globalMathRegex, (match) => solve(match));

  return result;
}

console.log(
  calc(`
Какой-то текст ((10 + 15) - 24) ** 2
Еще какой-то текст 2 * 10
`) ==
    `
Какой-то текст 1
Еще какой-то текст 20
`,
);
