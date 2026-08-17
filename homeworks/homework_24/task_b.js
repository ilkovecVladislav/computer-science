import { random, take } from "./task_a";

function filter(iterable, cb) {
  const iterator = Iterator.from(iterable);

  return Iterator.from({
    next() {
      while (true) {
        const result = iterator.next();

        if (result.done) {
          return { done: true };
        }

        if (cb(result.value)) {
          return { value: result.value, done: false };
        }
      }
    },
  });
}

const randomInt = random(0, 100);

console.log([
  ...take(
    filter(randomInt, (el) => el > 30),
    15,
  ),
]);
