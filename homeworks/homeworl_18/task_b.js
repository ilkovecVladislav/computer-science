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
