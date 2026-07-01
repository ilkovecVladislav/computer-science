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
