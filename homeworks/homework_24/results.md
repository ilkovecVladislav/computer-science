## Функция take

Необходимо написать функцию, которая принимает любой Iterable объект и количество элементов. Возвращает итератор, который выдаёт указанное количество элементов из исходного итератора.

```javascript
function random(min, max) {
  return Iterator.from({
    next() {
      return {
        value: Math.floor(Math.random() * (max - min + 1) + min),
        done: false,
      };
    },
  });
}

function take(iterable, limit) {
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

const randomInt = random(0, 100);
console.log([...take(randomInt, 15)]);
```

---

## Функция filter

Необходимо написать функцию, которая принимает любой Iterable объект и функцию-предикат. Возвращает итератор, который выдаёт только те элементы, которые удовлетворяют предикату.

```javascript
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
```

---

## Функция enumerate

Необходимо написать функцию, которая принимает любой Iterable объект и возвращает итератор по парам `[номер итерации, элемент]`. Нумерация начинается с 0.

```javascript
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

const randomInt = random(0, 100);

console.log([...take(enumerate(randomInt), 3)]); // [[0, ...], [1, ...], [2, ...]]
```

---

## Функция seq

Необходимо написать функцию, которая принимает множество Iterable объектов и возвращает итератор, последовательно выдающий элементы из каждого переданного итератора.

```javascript
function seq(...rest) {
  let index = 0;
  const iterators = rest.map((item) => Iterator.from(item));

  return Iterator.from({
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
  });
}

console.log([...seq([1, 2], new Set([3, 4]), "bla")]); // [1, 2, 3, 4, 'b', 'l', 'a']
```

---

## Функция mapSeq

Необходимо написать функцию, которая принимает любой Iterable объект и Iterable с функциями. Возвращает итератор, где к каждому элементу левого итератора последовательно применяются все функции из правого итератора.

```javascript
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
```
