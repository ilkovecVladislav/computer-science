const create = {
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
