export function random(min, max) {
  return Iterator.from({
    next() {
      return {
        value: Math.floor(Math.random() * (max - min + 1) + min),
        done: false,
      };
    },
  });
}

export function take(iterable, limit) {
  const iterator = Iterator.from(iterable);
  let currentStep = 0;

  return Iterator.from({
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
  });
}
