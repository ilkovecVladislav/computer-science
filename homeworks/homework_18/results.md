## Число или нет

```
const NUMBER_RANGES = [
  // 0-9 (Стандартные арабские цифры)
  { start: 0x0030, end: 0x0039 },

  // Римские цифры, дроби и спец. символы чисел (Ⅻ, ½, ⅓, ⅚)
  { start: 0x2150, end: 0x218f },

  // Полноширинные цифры (используются в восточноазиатских шрифтах) (０-９)
  { start: 0xff10, end: 0xff19 },

  // Верхние и нижние индексы (например, в формулах) (⁰, ₁, ²)
  { start: 0x2070, end: 0x209f },

  // Арабские-индийские цифры (используются в арабских странах) (٠-٩)
  { start: 0x0660, end: 0x0669 },

  // Деванагари (цифры языков Индии, например, хинди) (०-९)
  { start: 0x0966, end: 0x096f },

  // Числа в кружочках и скобках (①, ②, ⑩)
  { start: 0x2460, end: 0x2473 },
];

function checkSymbol(code, ranges) {
  let isNumber = false;

  for (let i = 0; i < ranges.length; i++) {
    let range = ranges[i];
    if (code >= range.start && code <= range.end) {
      isNumber = true;
      break;
    }
  }

  return isNumber;
}

function isDigit(value) {
  if (!value || typeof value !== "string" || value.length === 0) {
    return false;
  }

  for (const character of value) {
    const code = character.codePointAt(0);

    if (!checkSymbol(code, NUMBER_RANGES)) {
      return false;
    }
  }

  return true;
}

```

---

## Итератор по символам юникода

```
function iter(string) {
  return {
    [Symbol.iterator]() {
      let cursor = 0;

      return {
        next() {
          if (cursor < string.length) {
            const code = string.codePointAt(cursor);
            const char = String.fromCodePoint(code);

            const shift = code > 0xffff ? 2 : 1;

            cursor += shift;

            return {
              done: false,
              value: char,
            };
          } else {
            return {
              done: true,
            };
          }
        },
      };
    },
  };
}

```

---

## Итератор по графемам

```
function iter(string) {
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

  return {
    [Symbol.iterator]: function* () {
      for (const { segment } of segmenter.segment(string)) {
        yield segment;
      }
    },
  };
}

console.log([...iter("1😃à🇷🇺👩🏽‍❤️‍💋‍👨")]);

<!-- --------------------- Вариант без Intl.Segmenter------------------------------ -->

function shouldBreakBetween(current, next) {
  const ZWJ = 0x200d;
  const VS16 = 0xfe0f; // Вариативный селектор (часто идет после сердца или других символов)

  // 1. Если текущий или следующий символ — ZWJ, склеиваем
  if (current === ZWJ || next === ZWJ) return false;

  // 2. Если следующий символ — вариативный селектор, склеиваем
  if (next === VS16) return false;

  // 3. Модификаторы кожи
  if (next >= 0x1f3fb && next <= 0x1f3ff) return false;

  // 4. Диакритика
  if (next >= 0x0300 && next <= 0x036f) return false;

  // 5. Региональные индикаторы (флаги)
  if (
    current >= 0x1f1e6 &&
    current <= 0x1f1ff &&
    next >= 0x1f1e6 &&
    next <= 0x1f1ff
  )
    return false;

  return true;
}

function* iterV2(str) {
  const chars = [...str].map((char) => [char, char.codePointAt(0)]);

  for (let i = 0; i < chars.length; i++) {
    let [char, codePoint] = chars[i];
    let grapheme = char;

    while (i + 1 < chars.length) {
      const [nextChar, nextCodePoint] = chars[i + 1];

      if (shouldBreakBetween(codePoint, nextCodePoint)) {
        break;
      }

      grapheme += nextChar;
      codePoint = nextCodePoint;
      i++;
    }

    yield grapheme;
  }
}

console.log([...iterV2("1😃à🇷🇺👩🏽‍❤️‍💋‍👨")]);


```
