import { Vector, RGBA } from "./task_b.js";

class RGBAObj {
  constructor(r = 0, g = 0, b = 0, a = 255) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  set(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a ?? 255;
  }

  toHex() {
    const toHex = (c) => c.toString(16).padStart(2, "0");
    return `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}${toHex(this.a)}`;
  }
}

function createTestData(count) {
  const data = [];

  for (let i = 0; i < count; i++) {
    data.push([
      Math.random() * 255,
      Math.random() * 255,
      Math.random() * 255,
      255,
    ]);
  }

  return data;
}

function benchVector(testData, withGC = false) {
  const vec = new Vector({ capacity: testData.length }, RGBA);

  const start = performance.now();

  for (let i = 0; i < testData.length; i++) {
    vec.push(testData[i]);
  }

  for (let i = 0; i < testData.length; i++) {
    const color = vec.get(i);
    if (i % 1000 === 0) {
      vec.set(i, [255, 0, 0, 255]);
    }
  }

  for (let i = testData.length - 1; i >= 0; i--) {
    vec.pop();
  }

  const end = performance.now();
  return end - start;
}

// Бенчмарк для Array
function benchArray(testData, withGC = false) {
  const arr = [];

  const start = performance.now();

  for (let i = 0; i < testData.length; i++) {
    arr.push(new RGBAObj(...testData[i]));
  }

  for (let i = 0; i < testData.length; i++) {
    if (i % 1000 === 0) {
      arr[i] = new RGBAObj(255, 0, 0, 255);
    }
  }

  for (let i = testData.length - 1; i >= 0; i--) {
    arr.pop();
  }

  const end = performance.now();
  return end - start;
}

// Бенчмарк с множественными записями в Vector
function benchStressVector(iterations, withGC = false) {
  const vec = new Vector({ capacity: 100 }, RGBA);

  const start = performance.now();

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < 10000; i++) {
      vec.push([
        Math.random() * 255,
        Math.random() * 255,
        Math.random() * 255,
        255,
      ]);
    }

    for (let i = 0; i < 5000; i++) {
      vec.pop();
    }

    vec.shrinkToFit();

    if (withGC && iter % 10 === 0) {
      globalThis.gc?.();
    }
  }

  const end = performance.now();
  return end - start;
}

// Бенчмарк с множественными записями в Array
function benchStressArray(iterations, withGC = false) {
  const arr = [];

  const start = performance.now();

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < 10000; i++) {
      arr.push(
        new RGBAObj(
          Math.random() * 255,
          Math.random() * 255,
          Math.random() * 255,
          255,
        ),
      );
    }

    for (let i = 0; i < 5000; i++) {
      arr.pop();
    }

    arr.length = arr.length;

    if (withGC && iter % 10 === 0) {
      globalThis.gc?.();
    }
  }

  const end = performance.now();
  return end - start;
}

// Запуск бенчмарков
function runBenchmark() {
  console.log("=".repeat(60));
  console.log("БЕНЧМАРК: Vector<RGBA> vs Array<RGBAObj>");
  console.log("=".repeat(60));

  const sizes = [1000, 10000, 50000, 100000];

  console.log("\n📊 Тест 1: Последовательные push/pop/random access");
  console.log("-".repeat(60));
  console.log("Размер\t\tVector (ms)\tArray (ms)\tРазница");
  console.log("-".repeat(60));

  for (const size of sizes) {
    const testData = createTestData(size);

    // Прогрев
    benchVector(testData);
    benchArray(testData);

    // Основной замер
    const vecTime = benchVector(testData);
    const arrTime = benchArray(testData);
    const diff = (((arrTime - vecTime) / vecTime) * 100).toFixed(1);

    const diffSign = diff > 0 ? "+" : "";
    console.log(
      `${size}\t\t${vecTime.toFixed(2)}\t\t${arrTime.toFixed(2)}\t\t${diffSign}${diff}%`,
    );
  }

  const stressIterations = 500;

  console.log(
    `\n💥 Тест 2: Стресс-тест с ростом/сжатием (${stressIterations} итераций)`,
  );
  console.log("-".repeat(60));

  console.log("\nБез принудительного GC:");

  const vecStressNoGC = benchStressVector(stressIterations, false);
  const arrStressNoGC = benchStressArray(stressIterations, false);

  console.log(`Vector: ${vecStressNoGC.toFixed(2)}ms`);
  console.log(`Array:  ${arrStressNoGC.toFixed(2)}ms`);
  console.log(
    `Разница: ${(((arrStressNoGC - vecStressNoGC) / vecStressNoGC) * 100).toFixed(1)}%`,
  );

  if (globalThis.gc) {
    console.log("\nС принудительным GC (каждые 10 итераций):");

    globalThis.gc?.();

    const vecStressGC = benchStressVector(stressIterations, true);
    const arrStressGC = benchStressArray(stressIterations, true);
    console.log(`Vector: ${vecStressGC.toFixed(2)}ms`);
    console.log(`Array:  ${arrStressGC.toFixed(2)}ms`);
    console.log(
      `Разница: ${(((arrStressGC - vecStressGC) / vecStressGC) * 100).toFixed(1)}%`,
    );
  } else {
    console.log("\n⚠️  Запустите с флагом --expose-gc для тестов GC:");
    console.log("   node --expose-gc bench.js");
  }

  console.log("\n📈 Тест 3: Память (примерное потребление)");
  console.log("-".repeat(60));

  const memTestSize = 100000;
  const testData = createTestData(memTestSize);

  globalThis.gc?.();

  const memStartVec = process.memoryUsage().heapUsed;
  const vec = new Vector({ capacity: memTestSize }, RGBA);

  for (const data of testData) {
    vec.push(data);
  }

  const memEndVec = process.memoryUsage().heapUsed;

  globalThis.gc?.();

  const memStartArr = process.memoryUsage().heapUsed;
  const arr = [];

  for (const data of testData) {
    arr.push(new RGBAObj(...data));
  }

  const memEndArr = process.memoryUsage().heapUsed;

  const vecMem = (memEndVec - memStartVec) / 1024 / 1024;
  const arrMem = (memEndArr - memStartArr) / 1024 / 1024;
  const saving = (100 - (vecMem / arrMem) * 100).toFixed(1);

  console.log(`Vector: ${vecMem.toFixed(2)} MB`);
  console.log(`Array:  ${arrMem.toFixed(2)} MB`);
  console.log(`Экономия: ${saving}%`);
}

console.log("🚀 Запуск бенчмарка...\n");
console.log(
  "⚠️  Для точных замеров GC используйте: node --expose-gc bench.js\n",
);
runBenchmark();
