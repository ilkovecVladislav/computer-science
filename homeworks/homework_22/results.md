## Поиск всех чисел в тексте

Необходимо написать регулярное выражение, которое находит все числа (целые и с плавающей точкой) в тексте.

Требования:

- Целые числа: 42, -5, 0
- Числа с плавающей точкой: 3.14, -0.5, .5
- Не должны захватывать числа внутри слов (например, version2 или 1.0.2 — не число)

```js
const numberRegex = /(?<![\w.])([+-]?\d*\.?\d+)(?![\w.])/g;
const text =
  "The price is 100.5 dollars, -5 degrees, sam2 and version 2.0.1 is out.";

const numbers = text.match(numberRegex);
console.log(numbers); // ["100.5", "-5"]
```

---

## Проверка сложности пароля

Необходимо написать регулярное выражение для проверки, что пароль соответствует требованиям сложности.

Требования:

- Длина: от 8 до 20 символов
- Содержит хотя бы одну заглавную букву (A-Z)
- Содержит хотя бы одну строчную букву (a-z)
- Содержит хотя бы одну цифру (0-9)
- Содержит хотя бы один специальный символ (!@#$%^&\*)

```js
const passwordRegex =
  /^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).*$/;

console.log(passwordRegex.test("Password123!")); // true
console.log(passwordRegex.test("Paord1!")); // false (меньше 8 символов)
console.log(passwordRegex.test("PASSWORD123!")); // false (нет строчных)
console.log(passwordRegex.test("Password!")); // false (нет цифры)
console.log(passwordRegex.test("Pass123")); // false (нет спецсимвола)
console.log(passwordRegex.test("Password123")); // false (нет спецсимвола)
```
