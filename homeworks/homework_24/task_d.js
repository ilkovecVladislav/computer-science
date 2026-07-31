function seq(...rest) {
  let index = 0;
  const iterators = rest.map((item) => Iterator.from(item));

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      while (index < iterators.length) {
        const currentIterator = iterators[index];
        const result = currentIterator.next();

        if (!result.done) {
          return result;
        }

        index++;
      }

      return { done: true };
    },
  };
}

console.log([...seq([1, 2], new Set([3, 4]), "bla")]); // [1, 2, 3, 4, 'b', 'l', 'a']
