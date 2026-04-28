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

    this.#bytes = this.#bytes.subarray(0, Math.ceil(i / 2));
  }

  #addToBytes(value, index) {
    const byteIndex = Math.floor(index / 2);

    if (byteIndex >= this.#bytes.length) {
      const newSize = Math.min(
        this.#bytes.length * 2,
        Math.ceil(BCD.MAX_DIGITS / 2),
      );
      this.#bytes.buffer.resize(newSize);
    }

    if (index % 2 === 0) {
      this.#bytes[byteIndex] = value;
    } else {
      this.#bytes[byteIndex] = this.#bytes[byteIndex] | (value << 4);
    }
  }

  toNumber() {
    let result = 0;

    for (let i = 0; i < this.#bytes.length; i++) {
      const byte = this.#bytes[i];

      const rightDigit = byte & 0b1111;
      result += rightDigit * 10 ** (2 * i);
      const leftDigit = byte >>> 4;
      result += leftDigit * 10 ** (2 * i + 1);
    }

    return result;
  }

  toBigint() {
    let result = 0n;
    const ten = 10n;

    for (let i = 0; i < this.#bytes.length; i++) {
      const byte = this.#bytes[i];

      const rightDigit = BigInt(byte & 0b1111);
      result += rightDigit * ten ** BigInt(2 * i);
      const leftDigit = BigInt(byte >>> 4);
      result += leftDigit * ten ** BigInt(2 * i + 1);
    }

    return result;
  }

  toString() {
    let result = "";

    for (let i = this.#bytes.length - 1; i >= 0; i--) {
      const byte = this.#bytes[i];
      const left = byte >>> 4;
      const right = byte & 0b1111;

      if (result !== "" || left !== 0) {
        result += left;
      }

      if (result !== "" || right !== 0 || i === 0) {
        result += right;
      }
    }

    return result || "0";
  }

  at(index) {
    const len = this.#length;
    let normalizedIndex = index < 0 ? len + index : index;

    if (normalizedIndex < 0 || normalizedIndex >= len) {
      return undefined;
    }

    const internalIndex = len - 1 - normalizedIndex;

    const byteIndex = Math.floor(internalIndex / 2);
    const currentByte = this.#bytes[byteIndex];

    if (internalIndex % 2 === 0) {
      return currentByte & 0b1111;
    }
    return currentByte >>> 4;
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
