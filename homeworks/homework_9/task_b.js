function hexToRGB(hex) {
  let hexLongValueFormat;
  if (hex.length === 4) {
    hexLongValueFormat =
      "#" +
      hex
        .slice(1)
        .split("")
        .map((color) => `${color}${color}`)
        .join("");
  } else {
    hexLongValueFormat = hex.startsWith("#") ? hex : `#${hex}`;
  }

  const r = parseInt(hexLongValueFormat.slice(1, 3), 16);
  const g = parseInt(hexLongValueFormat.slice(3, 5), 16);
  const b = parseInt(hexLongValueFormat.slice(5, 7), 16);

  return [r, g, b, 255];
}

export class RGBA {
  static BYTES_PER_ELEMENT = 4;
  #offset;
  #view;

  constructor(view, offset = 0) {
    this.#offset = offset;
    this.#view = view;
  }

  static setElement(view, offset, value) {
    let encodedValue;
    if (Array.isArray(value)) {
      encodedValue = value;
    } else if (typeof value === "string") {
      encodedValue = hexToRGB(value);
    } else {
      return;
    }

    for (let i = 0; i < RGBA.BYTES_PER_ELEMENT; i++) {
      view.setUint8(offset + i, encodedValue[i]);
    }
  }

  static getElement(view, offset) {
    let result = [];
    for (let i = 0; i < RGBA.BYTES_PER_ELEMENT; i++) {
      result.push(view.getUint8(offset + i));
    }
    return result;
  }

  get red() {
    return this.#view.getUint8(this.#offset);
  }
  get green() {
    return this.#view.getUint8(this.#offset + 1);
  }
  get blue() {
    return this.#view.getUint8(this.#offset + 2);
  }
  get alpha() {
    return this.#view.getUint8(this.#offset + 3);
  }

  set red(value) {
    this.#view.setUint8(this.#offset, value);
  }
  set green(value) {
    this.#view.setUint8(this.#offset + 1, value);
  }
  set blue(value) {
    this.#view.setUint8(this.#offset + 2, value);
  }
  set alpha(value) {
    this.#view.setUint8(this.#offset + 3, value);
  }
}

export class Vector {
  #buffer;
  #dataView;
  #elementViewModel;

  constructor(capacityOrOptions, view) {
    let capacity = 1024;

    if (typeof capacityOrOptions === "number") {
      capacity = capacityOrOptions;
    } else if (capacityOrOptions && typeof capacityOrOptions === "object") {
      capacity = capacityOrOptions.capacity || capacity;
    }

    const bufferSize = 8 + capacity * view.BYTES_PER_ELEMENT;
    this.#buffer = new ArrayBuffer(bufferSize);
    this.#dataView = new DataView(this.#buffer);
    this.#elementViewModel = view;

    this.#dataView.setUint32(0, capacity);
    this.#dataView.setUint32(4, 0);
  }

  get capacity() {
    return this.#dataView.getUint32(0);
  }

  get length() {
    return this.#dataView.getUint32(4);
  }

  #getOffset(index) {
    return 8 + index * this.#elementViewModel.BYTES_PER_ELEMENT;
  }

  #reallocate(capacity) {
    let newCapacity = capacity !== undefined ? capacity : this.capacity * 2;
    if (newCapacity === 0) newCapacity = 1;

    const newBufferSize =
      8 + newCapacity * this.#elementViewModel.BYTES_PER_ELEMENT;
    const newBuffer = new ArrayBuffer(newBufferSize);

    const srcBytes = new Uint8Array(this.#buffer);
    const newBufferBytes = new Uint8Array(newBuffer);

    const bytesToCopy = Math.min(
      srcBytes.byteLength,
      newBufferBytes.byteLength,
    );

    newBufferBytes.set(srcBytes.subarray(0, bytesToCopy));

    this.#buffer = newBuffer;
    this.#dataView = new DataView(this.#buffer);
    this.#dataView.setUint32(0, newCapacity);
  }

  get(index) {
    if (index >= 0 && index < this.length) {
      const offset = this.#getOffset(index);
      return this.#elementViewModel.getElement(this.#dataView, offset);
    }

    throw new RangeError("Index out of bounds");
  }

  set(index, value) {
    if (index < 0 || index >= this.capacity) {
      throw new RangeError("Index out of bounds");
    }

    const offset = this.#getOffset(index);
    this.#elementViewModel.setElement(this.#dataView, offset, value);

    if (index >= this.length) {
      this.#dataView.setUint32(4, index + 1);
    }
  }

  fill(value) {
    for (
      let i = 8;
      i < this.#buffer.byteLength;
      i += this.#elementViewModel.BYTES_PER_ELEMENT
    ) {
      this.#elementViewModel.setElement(this.#dataView, i, value);
    }
  }

  pop() {
    const index = this.length - 1;
    const lastElement = this.get(index);

    this.#dataView.setUint32(4, index);
    return lastElement;
  }

  push(value) {
    if (this.length === this.capacity) {
      this.#reallocate();
    }

    this.set(this.length, value);
  }

  shrinkToFit() {
    if (this.length === this.capacity) {
      return;
    }

    const newCapacity = this.length;
    this.#reallocate(newCapacity);
  }

  reserve(extraCapacity) {
    if (this.length + extraCapacity > this.capacity) {
      this.#reallocate(this.length + extraCapacity);
    }
  }

  view(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError("Index out of bounds");
    }

    const offset = this.#getOffset(index);

    return new this.#elementViewModel(this.#dataView, offset);
  }

  shift() {
    const firstElement = this.get(0);
    if (this.length <= 1) {
      this.#dataView.setUint32(4, 0);
    } else {
      const bytes = new Uint8Array(this.#buffer);
      const startDst = 8;
      const startSrc = 8 + this.#elementViewModel.BYTES_PER_ELEMENT;
      const endSrc = 8 + this.length * this.#elementViewModel.BYTES_PER_ELEMENT;

      bytes.copyWithin(startDst, startSrc, endSrc);
      this.#dataView.setUint32(4, this.length - 1);
    }

    return firstElement;
  }

  unshift(value) {
    if (this.length === this.capacity) {
      this.#reallocate();
    }

    const bytes = new Uint8Array(this.#buffer);
    const startDst = 8 + this.#elementViewModel.BYTES_PER_ELEMENT;
    const startSrc = 8;
    const endSrc = 8 + this.length * this.#elementViewModel.BYTES_PER_ELEMENT;

    bytes.copyWithin(startDst, startSrc, endSrc);
    this.set(0, value);
    this.#dataView.setUint32(4, this.length + 1);
  }
}
