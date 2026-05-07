const DATA_LENGTH_CAPACITY = 4;
const ITEM_LENGTH_CAPACITY = 4;

class StringBuffer {
  buffer;

  getBuffer() {
    return this.buffer;
  }

  encodeStrings(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
    const encodedStrings = [];

    let encoder = new TextEncoder();
    for (let i = 0; i < data.length; i++) {
      encodedStrings.push(encoder.encode(data[i]));
    }

    const calucluatedDataCapacity = encodedStrings.reduce((acc, cur) => {
      return (acc += cur.length);
    }, 0);

    const totalCapacity =
      DATA_LENGTH_CAPACITY +
      ITEM_LENGTH_CAPACITY * data.length +
      calucluatedDataCapacity;

    const newBuffer = new ArrayBuffer(totalCapacity);
    const view = new DataView(newBuffer);

    let offset = 0;

    view.setUint32(0, data.length);
    offset += DATA_LENGTH_CAPACITY;

    for (let i = 0; i < encodedStrings.length; i++) {
      view.setUint32(offset, encodedStrings[i].length);
      offset += ITEM_LENGTH_CAPACITY;
      const bytes = new Uint8Array(newBuffer);
      bytes.set(encodedStrings[i], offset);

      offset += encodedStrings[i].length;
    }

    this.buffer = newBuffer;
  }

  decodeStrings(buffer) {
    let offset = 0;

    const view = new DataView(this.buffer);
    const totalStrings = view.getUint32(0);
    offset += DATA_LENGTH_CAPACITY;
    let decodedStrings = [];
    const decoder = new TextDecoder();

    for (let i = 0; i < totalStrings; i++) {
      const view = new DataView(buffer);
      const stringLength = view.getUint32(offset);

      offset += ITEM_LENGTH_CAPACITY;

      const stringBytes = new Uint8Array(buffer).subarray(
        offset,
        offset + stringLength,
      );

      decodedStrings.push(decoder.decode(stringBytes));
      offset += stringLength;
    }

    return decodedStrings;
  }

  at(index) {
    if (!this.buffer) {
      return undefined;
    }

    const view = new DataView(this.buffer);
    const totalStrings = view.getUint32(0);

    if (index < 0 || index >= totalStrings) {
      return undefined;
    }

    let offset = DATA_LENGTH_CAPACITY;

    for (let i = 0; i < index; i++) {
      const view = new DataView(this.buffer);
      const stringLength = view.getUint32(offset);
      offset += stringLength + ITEM_LENGTH_CAPACITY;
    }

    const targetLength = view.getUint32(offset);
    offset += ITEM_LENGTH_CAPACITY;

    const decoder = new TextDecoder();
    const stringBytes = new Uint8Array(this.buffer).subarray(
      offset,
      offset + targetLength,
    );

    return decoder.decode(stringBytes);
  }
}

const test = new StringBuffer();
test.encodeStrings(["hello", "world", ""]);
console.log(test.at(0));
console.log(test.at(1));

console.log(test.decodeStrings(test.getBuffer()));
