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

```
