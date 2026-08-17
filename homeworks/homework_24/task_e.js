function mapSeq(iterableArg, adapters) {
  const iterator = Iterator.from(iterableArg);

  return Iterator.from({
    next() {
      const result = iterator.next();

      if (result.done) {
        return { done: true };
      }

      let value = result.value;
      adapters.forEach((cb) => (value = cb(value)));

      return { done: false, value };
    },
  });
}

console.log([...mapSeq([1, 2, 3], [(el) => el * 2, (el) => el - 1])]); // [1, 3, 5]
