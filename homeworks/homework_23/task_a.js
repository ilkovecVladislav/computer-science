function random(min, max) {
  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      return {
        value: Math.floor(Math.random() * (max - min + 1) + min),
        done: false,
      };
    },
  };
}
