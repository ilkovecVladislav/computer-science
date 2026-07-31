## Итератор по случайным числам

Необходимо написать функцию-генератор для создания итератора, генерирующего случайные числа в заданном диапазоне.

```js
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
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
```

---

## Итератор по диапазонам значений

Необходимо написать класс Range, который позволяет создавать диапазоны чисел или символов и обходить элементы Range с любого конца.

```js
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

const symbolRange = new Range("a", "f");

console.log(Array.from(symbolRange)); // ["a", "b", "c", "d", "e", "f"]

const numberRange = new Range(-5, 1);

console.log(Array.from(numberRange.reverse())); // [1, 0, -1, -2, -3, -4, -5]
```

---

## Итератор по DOM с селектором

Необходимо написать функцию-итератор для поиска DOM-узлов, начиная с заданного, по CSS-селектору. Функция должна работать лениво и не запускать поиск сразу по всему DOM-дереву, а выполнять его по мере необходимости (при каждом вызове next()).

```js
function querySelectorAllLazy(selector, root) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.matches(selector)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    },
    false,
  );

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      const node = treeWalker.nextNode();
      if (node) {
        return { value: node, done: false };
      }

      return { value: undefined, done: true };
    },
  };
}

const iter = querySelectorAllLazy(".item", document.body);

console.log(iter.next().value); // Первый элемент с классом .item
console.log(iter.next().value); // Второй элемент
```
