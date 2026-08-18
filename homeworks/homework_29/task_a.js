class Writer {
  #logs;
  #value;

  constructor(value, logs = []) {
    this.#value = value;
    this.#logs = logs;
  }

  get value() {
    return this.#value;
  }

  get logs() {
    return this.#logs;
  }

  static of(value) {
    return new Writer(value, []);
  }

  map(fn) {
    return new Writer(fn(this.#value), this.#logs);
  }

  flatMap(fn) {
    const nextWriter = fn(this.#value);
    return new Writer(nextWriter.value, [...this.#logs, ...nextWriter.logs]);
  }

  tell(message) {
    return new Writer(this.#value, [...this.#logs, message]);
  }

  run() {
    return {
      value: this.#value,
      log: this.#logs,
    };
  }
}
