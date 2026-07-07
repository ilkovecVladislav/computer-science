const numberRegex = /(?<![\w.])([+-]?\d*\.?\d+)(?![\w.])/g;
const text =
  "The price is 100.5 dollars, -5 degrees, sam2 and version 2.0.1 is out.";

const numbers = text.match(numberRegex);
console.log(numbers); // ["100.5", "-5"]

const passwordRegex =
  /^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).*$/;

console.log(passwordRegex.test("Password123!")); // true
console.log(passwordRegex.test("Paord1!")); // false (меньше 8 символов)
console.log(passwordRegex.test("PASSWORD123!")); // false (нет строчных)
console.log(passwordRegex.test("Password!")); // false (нет цифры)
console.log(passwordRegex.test("Pass123")); // false (нет спецсимвола)
console.log(passwordRegex.test("Password123")); // false (нет спецсимвола)
