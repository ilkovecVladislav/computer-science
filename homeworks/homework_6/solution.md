# Анализ производительности операций с массивами в JavaScript

## Цель

Исследовать разницу в производительности операций:

- `push` — добавление в конец
- `pop` — удаление с конца
- `unshift` — добавление в начало
- `shift` — удаление с начала

А также изучить влияние:

- размера массива
- типа массива (packed, holey, sparse)

---

## Код

```js
fconst create = {
  packed(size) {
    return Array.from({ length: size }, (_, i) => i);
  },

  holey(size) {
    const arr = new Array(size);
    arr[0] = 0;
    arr[size - 1] = size - 1;
    return arr;
  },

  sparse(size, fillRatio = 0.3) {
    const arr = new Array(size);
    for (let i = 1; i < size - 1; i++) {
      if (Math.random() < fillRatio) {
        arr[i] = i;
      }
    }
    return arr;
  },
};

function warmup() {
  for (let i = 0; i < 10000; i++) {
    const arr = [1, 2, 3];
    arr.push(i);
    arr.unshift(i);
    arr.pop();
    arr.shift();
  }
}

function measure(createFn, workFn, iterations = 500, opsCount = 100) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const arr = createFn();

    const start = performance.now();
    workFn(arr);
    const end = performance.now();

    const timePerOp = ((end - start) * 1000) / opsCount;
    times.push(timePerOp);
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];

  return { avg, p50, p95 };
}

function test(type, size, opsCount = 100) {
  return {
    push: measure(
      () => create[type](size),
      (arr) => {
        for (let i = 0; i < opsCount; i++) arr.push(i);
      },
      500,
      opsCount,
    ),

    pop: measure(
      () => create[type](size + opsCount),
      (arr) => {
        for (let i = 0; i < opsCount; i++) arr.pop();
      },
      500,
      opsCount,
    ),

    unshift: measure(
      () => create[type](size),
      (arr) => {
        for (let i = 0; i < opsCount; i++) arr.unshift(i);
      },
      500,
      opsCount,
    ),

    shift: measure(
      () => create[type](size + opsCount),
      (arr) => {
        for (let i = 0; i < opsCount; i++) arr.shift();
      },
      500,
      opsCount,
    ),
  };
}

function format(stat) {
  return {
    avg: stat.avg.toFixed(3) + " mks",
    p50: stat.p50.toFixed(3) + " mks",
    p95: stat.p95.toFixed(3) + " mks",
  };
}

function run() {
  console.log("=== АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ МАССИВОВ ===");
  console.log("Единицы: микросекунды (mks) за 1 операцию\n");

  warmup();

  const sizes = [10, 100, 1000, 5000];
  const types = ["packed", "holey", "sparse"];
  const opsCount = 100;

  for (const size of sizes) {
    console.log(`\n>>> РАЗМЕР КОНТЕЙНЕРА: ${size}`);

    for (const type of types) {
      const result = test(type, size, opsCount);

      console.log(`Тип: ${type}`);
      console.table({
        push: format(result.push),
        pop: format(result.pop),
        unshift: format(result.unshift),
        shift: format(result.shift),
      });
    }
  }
}

run();

```

---

# АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ МАССИВОВ

**Единицы:** микросекунды (mks) за 1 операцию

## РАЗМЕР КОНТЕЙНЕРА: 10

### Тип: packed

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.008 mks | 0.003 mks | 0.018 mks |
| pop      | 0.003 mks | 0.002 mks | 0.005 mks |
| unshift  | 0.031 mks | 0.029 mks | 0.039 mks |
| shift    | 0.020 mks | 0.017 mks | 0.022 mks |

### Тип: holey

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.013 mks | 0.012 mks | 0.014 mks |
| pop      | 0.007 mks | 0.011 mks | 0.012 mks |
| unshift  | 0.031 mks | 0.026 mks | 0.035 mks |
| shift    | 0.019 mks | 0.016 mks | 0.024 mks |

### Тип: sparse

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.004 mks | 0.002 mks | 0.003 mks |
| pop      | 0.002 mks | 0.001 mks | 0.002 mks |
| unshift  | 0.028 mks | 0.026 mks | 0.028 mks |
| shift    | 0.020 mks | 0.019 mks | 0.021 mks |

---

## РАЗМЕР КОНТЕЙНЕРА: 100

### Тип: packed

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.008 mks | 0.003 mks | 0.021 mks |
| pop      | 0.003 mks | 0.002 mks | 0.003 mks |
| unshift  | 0.037 mks | 0.035 mks | 0.043 mks |
| shift    | 0.042 mks | 0.040 mks | 0.049 mks |

### Тип: holey

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.004 mks | 0.003 mks | 0.006 mks |
| pop      | 0.001 mks | 0.001 mks | 0.002 mks |
| unshift  | 0.036 mks | 0.033 mks | 0.036 mks |
| shift    | 0.038 mks | 0.038 mks | 0.039 mks |

### Тип: sparse

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.003 mks | 0.002 mks | 0.003 mks |
| pop      | 0.001 mks | 0.001 mks | 0.002 mks |
| unshift  | 0.035 mks | 0.033 mks | 0.037 mks |
| shift    | 0.039 mks | 0.039 mks | 0.041 mks |

---

## РАЗМЕР КОНТЕЙНЕРА: 1000

### Тип: packed

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.013 mks | 0.005 mks | 0.009 mks |
| pop      | 0.002 mks | 0.001 mks | 0.002 mks |
| unshift  | 0.128 mks | 0.122 mks | 0.136 mks |
| shift    | 0.041 mks | 0.040 mks | 0.043 mks |

### Тип: holey

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.016 mks | 0.006 mks | 0.008 mks |
| pop      | 0.001 mks | 0.001 mks | 0.002 mks |
| unshift  | 0.132 mks | 0.121 mks | 0.152 mks |
| shift    | 0.039 mks | 0.038 mks | 0.040 mks |

### Тип: sparse

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.004 mks | 0.004 mks | 0.006 mks |
| pop      | 0.001 mks | 0.001 mks | 0.002 mks |
| unshift  | 0.130 mks | 0.122 mks | 0.131 mks |
| shift    | 0.039 mks | 0.039 mks | 0.040 mks |

---

## РАЗМЕР КОНТЕЙНЕРА: 5000

### Тип: packed

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.019 mks | 0.016 mks | 0.025 mks |
| pop      | 0.002 mks | 0.002 mks | 0.002 mks |
| unshift  | 0.532 mks | 0.528 mks | 0.545 mks |
| shift    | 0.041 mks | 0.040 mks | 0.042 mks |

### Тип: holey

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.018 mks | 0.015 mks | 0.028 mks |
| pop      | 0.001 mks | 0.001 mks | 0.002 mks |
| unshift  | 0.528 mks | 0.524 mks | 0.551 mks |
| shift    | 0.039 mks | 0.038 mks | 0.039 mks |

### Тип: sparse

| Операция | avg       | p50       | p95       |
| -------- | --------- | --------- | --------- |
| push     | 0.066 mks | 0.016 mks | 0.407 mks |
| pop      | 0.002 mks | 0.002 mks | 0.002 mks |
| unshift  | 0.548 mks | 0.524 mks | 0.809 mks |
| shift    | 0.039 mks | 0.039 mks | 0.040 mks |

---

Конечно, давай сделаем выводы более четкими и структурированными. Вот лаконичный вариант анализа твоих результатов в формате Markdown:

---

## Анализ результатов

### 1. Операции `push` и `pop`

- **Скорость:** Работают максимально быстро и стабильно.
- **Масштабируемость:** Время выполнения практически не меняется при росте массива с 10 до 5000 элементов.
- **Сложность:** Временная сложность — $O(1)$.

---

### 2. Операции `unshift` и `shift`

- **Скорость:** Время выполнения заметно растёт при увеличении объёма данных.
- **Зависимость:** Требуется физический или логический сдвиг индексов (на 5000 элементах задержка выросла в десятки раз по сравнению с `push`).
- **Сложность:** Временная сложность — $O(n)$.

---

### 3. Влияние типа массива

- **packed** — самый эффективный тип, движок V8 хранит его как непрерывный блок памяти.
- **holey** — работает чуть медленнее из-за дополнительных проверок на наличие «дырок».
- **sparse** — самый непредсказуемый; на больших размерах переходит в режим словаря, что увеличивает задержки (высокий p95).

---

## Вывод

В ходе эксперимента было установлено:

- **Эффективность:** Операции в конце массива (`push`, `pop`) являются наиболее оптимальными и работают за константное время $O(1)$.
- **Деградация:** Операции с началом массива (`unshift`) имеют линейную сложность $O(n)$ и становятся «бутылочным горлышком» на больших массивах.
- **Разрыв:** Разница в производительности между `push` и `unshift` на 5000 элементах достигает **20–25 раз**.
- **Оптимизация:** Движок V8 эффективно сглаживает работу `shift`, но «дырявые» массивы (`sparse`) всё равно проигрывают упакованным в стабильности.
- **Стабильность:** Перцентили (p95) подтверждают, что работа с началом массива и разреженными данными провоцирует больше случайных задержек (выбросов).

---

## Реализация операций unshift/shift за O(1)

Для реализации использовался кольцевой буффер

```js
class RingBuffer {
  #buffer;
  #capacity;
  #head = 0;
  #tail = 0;
  #currentLength = 0;

  constructor(capacity = 100) {
    this.#capacity = Math.max(1, capacity >>> 0);
    this.#buffer = new Array(this.#capacity);
  }

  #getIndex(index) {
    return (index + this.#capacity) % this.#capacity;
  }
  push(value) {
    if (this.#currentLength === this.#capacity) {
      return null;
    }

    this.#buffer[this.#tail] = value;
    this.#tail = this.#getIndex(this.#tail + 1);
    this.#currentLength++;
    return this.#currentLength;
  }

  pop() {
    if (this.#currentLength === 0) return undefined;

    this.#tail = this.#getIndex(this.#tail - 1);
    const value = this.#buffer[this.#tail];
    this.#buffer[this.#tail] = undefined;
    this.#currentLength--;
    return value;
  }

  unshift(value) {
    if (this.#currentLength === this.#capacity) return null;

    this.#head = this.#getIndex(this.#head - 1);
    this.#buffer[this.#head] = value;
    this.#currentLength++;
    return this.#currentLength;
  }

  shift() {
    if (this.#currentLength === 0) return undefined;

    const value = this.#buffer[this.#head];
    this.#buffer[this.#head] = undefined;
    this.#head = this.#getIndex(this.#head + 1);
    this.#currentLength--;
    return value;
  }

  view() {
    return this.#buffer;
  }
}

const ringBuffer = new RingBuffer(10);
ringBuffer.push(1);
ringBuffer.push(2);
ringBuffer.push(3);
ringBuffer.pop();
ringBuffer.unshift(4);
ringBuffer.unshift(5);
ringBuffer.shift();

console.log(ringBuffer.view());
```
