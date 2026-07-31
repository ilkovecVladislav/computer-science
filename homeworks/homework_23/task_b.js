class Range {
  // Передаем тип явно или определяем его внутри
  static getConvertedToNumberValue(value, type) {
    if (type === "string") {
      return value.charCodeAt(0);
    }
    return value;
  }

  static getDisplayValue(value, type) {
    if (type === "string") {
      return String.fromCharCode(value);
    }
    return value;
  }

  constructor(start, end) {
    if (typeof start !== typeof end) {
      throw new Error("Arguments must be the same type");
    }

    this.dataType = typeof start;
    this.a = start;
    this.b = end;

    this.start = Range.getConvertedToNumberValue(start, this.dataType);
    this.end = Range.getConvertedToNumberValue(end, this.dataType);

    this.direction = this.start <= this.end ? "ASC" : "DESC";
  }

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    const dataType = this.dataType;
    const step = this.direction === "ASC" ? 1 : -1;
    const isDone = () => (step > 0 ? current > end : current < end);

    const iterator = {
      [Symbol.iterator]() {
        return this;
      },

      next() {
        if (isDone()) {
          return { done: true };
        }

        const value = Range.getDisplayValue(current, dataType);
        current += step;

        return { value, done: false };
      },
    };

    return iterator;
  }

  reverse() {
    return new Range(this.b, this.a);
  }
}
