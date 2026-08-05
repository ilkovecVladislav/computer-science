export class ParserIterator {
  readonly input: string;
  get position() {
    return this.#position;
  }
  #position: number = 0;
  constructor(input: string, position = 0) {
    this.input = input;
    this.changePosition(position);
  }
  [Symbol.iterator]() {
    return this;
  }
  clone() {
    return new ParserIterator(this.input, this.position);
  }
  peek() {
    return this.#getChar(this.position);
  }
  next() {
    const value = this.#getChar(this.position);
    if (value === undefined) {
      return { value, done: true };
    }
    this.#position += value.length;
    return { value, done: false };
  }
  changePosition(position: number) {
    this.#position = position;
  }
  #getChar(index: number): string {
    const str = this.input;
    const code = str.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff && index + 1 < str.length) {
      const next = str.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        return str.slice(index, index + 2);
      }
    }
    return str[index];
  }
}

export function take(pattern: Function | RegExp, { min = 1, max = Infinity }) {
  function test(value: string) {
    return pattern instanceof RegExp ? pattern.test(value) : pattern(value);
  }

  return (input: string | ParserIterator) => {
    const iterator =
      input instanceof ParserIterator ? input : new ParserIterator(input);

    let result = "";
    let count = 0;

    while (count < max) {
      const char = iterator.peek();
      if (char == null || !test(char)) {
        break;
      }
      result += char;
      count++;
      iterator.next();
    }

    if (count < min) {
      throw new Error(
        `Expected at least ${min} characters matching pattern "${pattern}"`,
      );
    }

    return [result, iterator];
  };
}
