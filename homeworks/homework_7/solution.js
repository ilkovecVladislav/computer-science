const HEADER_SIZE = 4;
const ITEM_LEN_SIZE = 4;
const ITEM_OFFSET_SIZE = 4;

class StringBuffer {
  #buffer;
  #view;
  #bytes;
  #decoder = new TextDecoder();

  getBuffer() {
    return this.#buffer;
  }

  encodeStrings(data) {
    if (!Array.isArray(data) || data.length === 0) return null;

    const encoder = new TextEncoder();
    const encodedStrings = data.map((str) => encoder.encode(str));

    const dataCapacity = encodedStrings.reduce(
      (acc, cur) => acc + cur.length,
      0,
    );
    const totalCapacity =
      HEADER_SIZE + ITEM_LEN_SIZE * data.length + dataCapacity;

    this.#buffer = new ArrayBuffer(totalCapacity);
    this.#view = new DataView(this.#buffer);
    this.#bytes = new Uint8Array(this.#buffer);

    let offset = 0;
    this.#view.setUint32(offset, data.length);
    offset += HEADER_SIZE;

    for (const encoded of encodedStrings) {
      this.#view.setUint32(offset, encoded.length);
      offset += ITEM_LEN_SIZE;
      this.#bytes.set(encoded, offset);
      offset += encoded.length;
    }

    return this.#buffer;
  }

  at(index) {
    if (!this.#buffer) return undefined;

    const totalStrings = this.#view.getUint32(0);
    const normalizedIndex = index < 0 ? totalStrings + index : index;

    if (normalizedIndex < 0 || normalizedIndex >= totalStrings) {
      return undefined;
    }

    let offset = HEADER_SIZE;

    for (let i = 0; i < normalizedIndex; i++) {
      const stringLength = this.#view.getUint32(offset);
      offset += ITEM_LEN_SIZE + stringLength;
    }

    const targetLength = this.#view.getUint32(offset);
    offset += ITEM_LEN_SIZE;

    const stringBytes = this.#bytes.subarray(offset, offset + targetLength);
    return this.#decoder.decode(stringBytes);
  }

  decodeStrings(buffer = this.#buffer) {
    if (!buffer) return [];

    const view = buffer === this.#buffer ? this.#view : new DataView(buffer);
    const bytes =
      buffer === this.#buffer ? this.#bytes : new Uint8Array(buffer);

    const totalStrings = view.getUint32(0);
    let offset = HEADER_SIZE;
    const result = new Array(totalStrings);

    for (let i = 0; i < totalStrings; i++) {
      const stringLength = view.getUint32(offset);
      offset += ITEM_LEN_SIZE;

      const stringBytes = bytes.subarray(offset, offset + stringLength);
      result[i] = this.#decoder.decode(stringBytes);

      offset += stringLength;
    }

    return result;
  }
}

const test = new StringBuffer();
test.encodeStrings(["hello", "world", ""]);
console.log(test.at(0));
console.log(test.at(1));

console.log(test.decodeStrings(test.getBuffer()));

class StringBufferV2 {
  #buffer;
  #view;
  #bytes;
  #decoder = new TextDecoder();

  getBuffer() {
    return this.#buffer;
  }

  encodeStrings(data) {
    if (!Array.isArray(data) || data.length === 0) return null;

    const encoder = new TextEncoder();
    const encodedStrings = data.map((str) => encoder.encode(str));

    const encodedStringsCapacity = encodedStrings.reduce(
      (acc, cur) => acc + cur.length,
      0,
    );

    let indexOffset = HEADER_SIZE;
    let dataOffset =
      HEADER_SIZE + (ITEM_LEN_SIZE + ITEM_OFFSET_SIZE) * data.length;

    const totalCapacity = dataOffset + encodedStringsCapacity;

    this.#buffer = new ArrayBuffer(totalCapacity);
    this.#view = new DataView(this.#buffer);
    this.#bytes = new Uint8Array(this.#buffer);

    this.#view.setUint32(0, data.length);

    for (let i = 0; i < encodedStrings.length; i++) {
      this.#view.setUint32(indexOffset, encodedStrings[i].length);
      this.#view.setUint32(indexOffset + ITEM_LEN_SIZE, dataOffset);
      this.#bytes.set(encodedStrings[i], dataOffset);
      indexOffset += ITEM_LEN_SIZE + ITEM_OFFSET_SIZE;
      dataOffset += encodedStrings[i].length;
    }

    return this.#buffer;
  }

  at(index) {
    if (!this.#buffer) return undefined;

    const totalStrings = this.#view.getUint32(0);
    const normalizedIndex = index < 0 ? totalStrings + index : index;

    if (normalizedIndex < 0 || normalizedIndex >= totalStrings) {
      return undefined;
    }

    const entryOffset =
      HEADER_SIZE + (ITEM_LEN_SIZE + ITEM_OFFSET_SIZE) * normalizedIndex;

    let stringLength = this.#view.getUint32(entryOffset);

    let dataPointer = this.#view.getUint32(entryOffset + ITEM_LEN_SIZE);

    const stringBytes = this.#bytes.subarray(
      dataPointer,
      dataPointer + stringLength,
    );
    return this.#decoder.decode(stringBytes);
  }

  decodeStrings(buffer = this.#buffer) {
    if (!buffer) return [];

    const view = buffer === this.#buffer ? this.#view : new DataView(buffer);
    const bytes =
      buffer === this.#buffer ? this.#bytes : new Uint8Array(buffer);

    const totalStrings = view.getUint32(0);
    const result = new Array(totalStrings);

    for (let i = 0; i < totalStrings; i++) {
      const entryOffset = HEADER_SIZE + (ITEM_LEN_SIZE + ITEM_OFFSET_SIZE) * i;
      let stringLength = view.getUint32(entryOffset);
      let dataPointer = view.getUint32(entryOffset + ITEM_LEN_SIZE);

      const stringBytes = bytes.subarray(
        dataPointer,
        dataPointer + stringLength,
      );
      result[i] = this.#decoder.decode(stringBytes);
    }

    return result;
  }

  set(index, newValue) {
    const encoder = new TextEncoder();
    const encodedString = encoder.encode(newValue);

    const totalStrings = this.#view.getUint32(0);
    const normalizedIndex = index < 0 ? totalStrings + index : index;

    if (normalizedIndex < 0 || normalizedIndex >= totalStrings) {
      return undefined;
    }

    const entryOffset =
      HEADER_SIZE + (ITEM_LEN_SIZE + ITEM_OFFSET_SIZE) * normalizedIndex;
    const oldStringLength = this.#view.getUint32(entryOffset);

    if (encodedString.length <= oldStringLength) {
      const dataPointer = this.#view.getUint32(entryOffset + ITEM_LEN_SIZE);

      this.#view.setUint32(entryOffset, encodedString.length);

      this.#bytes.set(encodedString, dataPointer);
    } else {
      const currentStrings = this.decodeStrings();
      currentStrings[normalizedIndex] = newValue;
      this.encodeStrings(currentStrings);
    }
  }
}

const strings = ["hello", "мир", ""];

const stringBufferV2 = new StringBufferV2();

stringBufferV2.encodeStrings(strings);

console.log(stringBufferV2.at(0)); // "hello"

stringBufferV2.set(0, "Привет, ");

console.log(stringBufferV2.at(0)); // "Привет, "

stringBufferV2.set(-1, "!");

console.log(stringBufferV2.decodeStrings(stringBufferV2.getBuffer())); // ["Привет, ", "мир", "!"]
