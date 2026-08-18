## Контейнер Writer

Необходимо написать контейнер `Writer`, который хранит значение вместе с логом операций над ним.

Контейнер должен поддерживать интерфейс функтора и монады, а также метод `run`, возвращающий значение и накопленный лог. Исходный контейнер изменяться не должен — каждая операция создаёт новый.

```js
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

const result = Writer.of(10)
  .map((v) => v * 2) // Лог не пополняется
  .flatMap((v) => new Writer(v + 5, ["Прибавили 5"]))
  .flatMap((v) => new Writer(v / 5, ["Поделили на 5"]));

const { value, log } = result.run();

console.log(value); // 5
console.log(log); // ["Прибавили 5", "Поделили на 5"]

const f = (v) => v * 2;
const g = (v) => v + 5;

const w = new Writer(10, ["Начальный шаг"]);

const result1 = w.map(f).map(g).run();

const result2 = w.map((v) => g(f(v))).run();

console.log("Результат 1:", result1);
// { value: 25, log: ["Начальный шаг"] }

console.log("Результат 2:", result2);
// { value: 25, log: ["Начальный шаг"] }

const isValuesEqual = result1.value === result2.value;
const isLogsEqual = JSON.stringify(result1.log) === JSON.stringify(result2.log);

console.log("Закон функтора соблюден:", isValuesEqual && isLogsEqual); // true
```

Дополнительно:

- Добавьте метод `tell(message)`, дописывающий сообщение в лог без изменения значения (возвращает новое значение).
- Проверьте закон функтора: `w.map(f).map(g)` должно давать тот же результат, что и `w.map((v) => g(f(v)))`.

---

## Контейнер Mutex

Необходимо написать контейнер `Mutex`, который защищает данные от одновременного доступа нескольких потребителей.

Метод `read` возвращает промис, который резолвится, только когда ресурс свободен. Пока потребитель не вызвал `free`, все остальные ждут в очереди и получают доступ в порядке обращения.

```js
class Mutex {
  #resource;
  #queue;
  #isLocked;

  constructor(data) {
    this.#resource = data;
    this.#queue = [];
    this.#isLocked = false;
  }

  read = () => {
    return new Promise((resolve) => {
      if (!this.#isLocked) {
        this.#isLocked = true;
        resolve({
          value: this.#resource,
          free: this.#createReleaseFunction(),
        });
      } else {
        this.#queue.push({ resolve });
      }
    });
  };

  free = () => {
    if (this.#queue.length > 0) {
      const item = this.#queue.shift();
      item.resolve({
        value: this.#resource,
        free: this.#createReleaseFunction(),
      });
    } else {
      this.#isLocked = false;
    }
  };

  withLock = async (fn) => {
    const { value, free } = await this.read();
    try {
      return await fn(value);
    } finally {
      free();
    }
  };

  #createReleaseFunction() {
    let isReleased = false;
    return () => {
      if (isReleased) return;
      isReleased = true;
      this.free();
    };
  }
}

class Semaphore {
  #resource;
  #limit;
  #activeCount;
  #queue;

  constructor(data, limit = 1) {
    this.#resource = data;
    this.#limit = limit;
    this.#activeCount = 0;
    this.#queue = [];
  }

  read = () => {
    return new Promise((resolve) => {
      if (this.#activeCount < this.#limit) {
        this.#activeCount++;
        resolve({
          value: this.#resource,
          free: this.#createReleaseFunction(),
        });
      } else {
        this.#queue.push({ resolve });
      }
    });
  };

  free = () => {
    if (this.#queue.length > 0) {
      const item = this.#queue.shift();
      item.resolve({
        value: this.#resource,
        free: this.#createReleaseFunction(),
      });
    } else {
      this.#activeCount--;
    }
  };

  withLock = async (fn) => {
    const { value, free } = await this.read();
    try {
      return await fn(value);
    } finally {
      free();
    }
  };

  #createReleaseFunction() {
    let isReleased = false;
    return () => {
      if (isReleased) return;
      isReleased = true;
      this.free();
    };
  }
}

const cell = new Mutex({ count: 0 });

async function increment(name) {
  const { value, free } = await cell.read(); // Ожидаем получение доступа
  value.count++;
  console.log(name, value.count);
  free(); // Освобождаем ресурс
}

increment("A"); // A 1
increment("B"); // B 2 — дождется освобождения
increment("C"); // C 3
```

Дополнительно:

- Сделайте так, чтобы повторный вызов `free` не ломал очередь.
- Добавьте метод `withLock(fn)`, который сам захватывает и освобождает ресурс, в том числе при исключении внутри `fn`.
- Расширьте решение до `Semaphore(n)`, разрешающего доступ n потребителям одновременно.

---
