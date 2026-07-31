export function random(min, max) {
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

export function take(iterator, limit) {
  let currentStep = 0;

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      if (currentStep >= limit) {
        return { value: undefined, done: true };
      }

      const result = iterator.next();

      if (result.done) {
        return { value: undefined, done: true };
      }

      currentStep++;
      return { value: result.value, done: false };
    },
  };
}
