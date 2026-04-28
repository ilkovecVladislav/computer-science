class BCD {
  static MAX_DIGITS = 200;

  #bytes = new Uint8Array(
    new ArrayBuffer(1, { maxByteLength: BCD.MAX_DIGITS }),
  );
  #length = 0;

  constructor(num) {
    let i = 0;
    let temp = num;

    const isBigInt = typeof num === "bigint";
    const zero = isBigInt ? 0n : 0;
    const ten = isBigInt ? 10n : 10;

    do {
      let digit = isBigInt ? Number(temp % ten) : temp % ten;

      this.#addToBytes(digit, i);

      temp = isBigInt ? temp / ten : Math.floor(temp / ten);
      i++;
    } while (temp > zero);

    this.#length = i;

    this.#bytes = this.#bytes.subarray(0, i);
  }

  #addToBytes(value, index) {
    if (index >= this.#bytes.length) {
      const newSize = Math.min(this.#bytes.length * 2, BCD.MAX_DIGITS);
      this.#bytes.buffer.resize(newSize);
    }
    this.#bytes[index] = value;
  }

  toNumber() {
    let result = 0;
    for (let i = 0; i < this.#bytes.length; i++) {
      result += this.#bytes[i] * 10 ** i;
    }
    return result;
  }

  toBigint() {
    let result = 0n;
    for (let i = 0; i < this.#bytes.length; i++) {
      result += BigInt(this.#bytes[i]) * 10n ** BigInt(i);
    }
    return result;
  }

  toString() {
    return Array.from(this.#bytes).reverse().join("");
  }

  at(index) {
    const len = this.#length;
    let normalizedIndex = index < 0 ? len + index : index;

    if (normalizedIndex < 0 || normalizedIndex >= len) {
      return undefined;
    }

    const internalIndex = len - 1 - normalizedIndex;
    return this.#bytes[internalIndex];
  }
}

const n = new BCD(65536);
console.log(n.toBigint()); // 65536n
console.log(n.toNumber()); // 65536
console.log(n.toString()); // "65536"

console.log(n.at(0)); // 6
console.log(n.at(1)); // 5

console.log(n.at(-1)); // 6
console.log(n.at(-2)); // 3
