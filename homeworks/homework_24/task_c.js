const randomInt = random(0, 100);

function enumerate(iterable) {
  const iterator = Iterator.from(iterable);
  let step = 0;

  return Iterator.from({
    next() {
      const result = iterator.next();

      if (result.done) {
        return { done: true };
      }

      return { value: [step++, result.value], done: false };
    },
  });
}

console.log([...take(enumerate(randomInt), 3)]); // [[0, ...], [1, ...], [2, ...]]
