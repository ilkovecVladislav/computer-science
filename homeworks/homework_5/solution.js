const ROW_MAJOR = "rowMajor";
const COLUMN_MAJOR = "columnMajor";

class PixelStream {
  constructor(width, height) {
    this.width = width; // columns
    this.height = height; // rows
  }

  forEach(mode, cb) {
    if (mode === ROW_MAJOR) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          cb(this.getPixel(x, y), x, y);
        }
      }
    } else {
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          cb(this.getPixel(x, y), x, y);
        }
      }
    }
  }
}

class FlatArrayPixelStream extends PixelStream {
  constructor(width, height) {
    super(width, height);
    this.data = new Array(width * height * 4).fill(0);
  }

  getIndex(x, y) {
    return (y * this.width + x) * 4;
  }

  getPixel(x, y) {
    const idx = this.getIndex(x, y);
    return [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
  }

  setPixel(x, y, rgba) {
    const idx = this.getIndex(x, y);
    this.data[idx] = rgba[0];
    this.data[idx + 1] = rgba[1];
    this.data[idx + 2] = rgba[2];
    this.data[idx + 3] = rgba[3];
    return rgba;
  }
}

class ArrayOfArraysPixelStream extends PixelStream {
  constructor(width, height) {
    super(width, height);
    this.data = Array.from({ length: width * height }, () => [0, 0, 0, 0]);
  }

  getIndex(x, y) {
    return y * this.width + x;
  }

  getPixel(x, y) {
    const pixel = this.data[this.getIndex(x, y)];
    return [pixel[0], pixel[1], pixel[2], pixel[3]];
  }

  setPixel(x, y, rgba) {
    const pixel = this.data[this.getIndex(x, y)];
    pixel[0] = rgba[0];
    pixel[1] = rgba[1];
    pixel[2] = rgba[2];
    pixel[3] = rgba[3];
    return rgba;
  }
}

class ArrayOfObjectsPixelStream extends PixelStream {
  constructor(width, height) {
    super(width, height);
    this.data = Array.from({ length: width * height }, () => ({
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }));
  }

  getIndex(x, y) {
    return y * this.width + x;
  }

  getPixel(x, y) {
    const pixel = this.data[this.getIndex(x, y)];
    return [pixel.r, pixel.g, pixel.b, pixel.a];
  }

  setPixel(x, y, rgba) {
    const pixel = this.data[this.getIndex(x, y)];
    pixel.r = rgba[0];
    pixel.g = rgba[1];
    pixel.b = rgba[2];
    pixel.a = rgba[3];
    return rgba;
  }
}

class Uint8PixelStream extends PixelStream {
  constructor(width, height) {
    super(width, height);
    this.data = new Uint8Array(width * height * 4);
  }

  getIndex(x, y) {
    return (y * this.width + x) * 4;
  }

  getPixel(x, y) {
    const idx = this.getIndex(x, y);
    return [
      this.data[idx],
      this.data[idx + 1],
      this.data[idx + 2],
      this.data[idx + 3],
    ];
  }

  setPixel(x, y, rgba) {
    const idx = this.getIndex(x, y);
    this.data[idx] = rgba[0];
    this.data[idx + 1] = rgba[1];
    this.data[idx + 2] = rgba[2];
    this.data[idx + 3] = rgba[3];
    return rgba;
  }
}

if (!("gc" in globalThis)) {
  console.log("Запустите с флагом --expose-gc для точных результатов");
  console.log("Пример: node --expose-gc benchmark.js\n");
}

runBenchmark();

function runBenchmark() {
  const sizes = [
    { width: 50, height: 50, name: "25K" },
    { width: 500, height: 500, name: "250K" },
    { width: 1000, height: 1000, name: "1M" },
  ];

  const implementations = [
    { Class: FlatArrayPixelStream },
    { Class: ArrayOfArraysPixelStream },
    { Class: ArrayOfObjectsPixelStream },
    { Class: Uint8PixelStream },
  ];

  function randomColor() {
    return [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      255,
    ];
  }

  const WARMUP = 10;

  for (const size of sizes) {
    console.log(
      `\n📐 Размер: ${size.width}x${size.height} (${size.name} пикселей)`,
    );
    console.log("-".repeat(80));

    for (const impl of implementations) {
      console.log(`\n Тестирование ${impl.Class.name}`);
      globalThis.gc?.();

      const stream = new impl.Class(size.width, size.height);

      // Заполнение случайными цветами
      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          stream.setPixel(x, y, randomColor());
        }
      }

      // Прогрев
      let warmupSum = 0;

      for (let w = 0; w < WARMUP; w++) {
        stream.forEach("rowMajor", (rgba) => {
          warmupSum += rgba[0] + rgba[1] + rgba[2];
        });
        stream.forEach("colMajor", (rgba) => {
          warmupSum += rgba[0] + rgba[1] + rgba[2];
        });
      }

      console.log(
        `\n🔥 Прогрев (контрольная сумма: ${warmupSum.toString(36)})`,
      );
      globalThis.gc?.();

      // Тест 1: Чтение по строкам
      let sum1 = 0;

      const rowReadStart = performance.now();
      stream.forEach("rowMajor", (rgba) => {
        sum1 += rgba[0] + rgba[1] + rgba[2];
      });
      const rowReadTime = performance.now() - rowReadStart;

      console.log(`  Контрольная сумма (row): ${sum1.toString(36)}`);
      globalThis.gc?.();

      // Тест 2: Чтение по столбцам
      let sum2 = 0;

      const colReadStart = performance.now();
      stream.forEach("colMajor", (rgba) => {
        sum2 += rgba[0] + rgba[1] + rgba[2];
      });
      const colReadTime = performance.now() - colReadStart;

      console.log(`  Контрольная сумма (col): ${sum2.toString(36)}`);
      globalThis.gc?.();

      // Тест 3: Случайное чтение
      let sum5 = 0;
      const randReadStart = performance.now();

      for (let i = 0; i < size.width * size.height; i++) {
        const x = Math.floor(Math.random() * size.width);
        const y = Math.floor(Math.random() * size.height);
        const p = stream.getPixel(x, y);
        sum5 += p[0] + p[1] + p[2];
      }

      const randReadTime = performance.now() - randReadStart;
      console.log(`  Контрольная сумма (rand): ${sum5.toString(36)}`);

      console.log("\n  Результаты:\n");
      console.log(`    Чтение (по строкам):    ${rowReadTime.toFixed(2)}ms`);
      console.log(`    Чтение (по столбцам):   ${colReadTime.toFixed(2)}ms`);
      console.log(`    Случайное чтение:       ${randReadTime.toFixed(2)}ms`);
      console.log("\n  ###");
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("Финализация (4M пикселей)");
  console.log("=".repeat(80));

  const size = { width: 2000, height: 2000 };
  const results = [];

  for (const impl of implementations) {
    console.log(`\n Тестирование ${impl.Class.name}`);
    globalThis.gc?.();

    const stream = new impl.Class(size.width, size.height);

    // Заполнение случайными цветами
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        stream.setPixel(x, y, randomColor());
      }
    }

    // Прогрев
    let warmupSumFinal = 0;

    for (let w = 0; w < WARMUP; w++) {
      stream.forEach("rowMajor", (rgba) => {
        warmupSumFinal += rgba[0] + rgba[1] + rgba[2];
      });
      stream.forEach("colMajor", (rgba) => {
        warmupSumFinal += rgba[0] + rgba[1] + rgba[2];
      });
    }

    console.log(
      `\n🔥 Прогрев (контрольная сумма: ${warmupSumFinal.toString(36)})`,
    );
    globalThis.gc?.();

    // Тест 1: Чтение по строкам
    let sum1 = 0;

    const rowStart = performance.now();
    stream.forEach("rowMajor", (rgba) => {
      sum1 += rgba[0] + rgba[1] + rgba[2];
    });
    const rowTime = performance.now() - rowStart;

    console.log(`  Контрольная сумма (row): ${sum1.toString(36)}`);
    globalThis.gc?.();

    // Тест 2: Чтение по столбцам
    let sum2 = 0;

    const colStart = performance.now();
    stream.forEach("colMajor", (rgba) => {
      sum2 += rgba[0] + rgba[1] + rgba[2];
    });
    const colTime = performance.now() - colStart;

    console.log(`  Контрольная сумма (col): ${sum2.toString(36)}`);
    globalThis.gc?.();

    // Тест 3: Случайное чтение
    let sum3 = 0;
    const randStart = performance.now();

    for (let i = 0; i < size.width * size.height; i++) {
      const x = Math.floor(Math.random() * size.width);
      const y = Math.floor(Math.random() * size.height);
      const p = stream.getPixel(x, y);
      sum3 += p[0] + p[1] + p[2];
    }

    const randTime = performance.now() - randStart;
    console.log(`  Контрольная сумма (rand): ${sum3.toString(36)}`);

    results.push({ name: impl.Class.name, rowTime, colTime, randTime });
  }

  results.sort((a, b) => a.rowTime - b.rowTime);
  console.log(`\n🏆 РЕЙТИНГ (от быстрого к медленному):\n`);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const medal = i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";

    console.log(`${medal} ${r.name}:`);
    console.log(`     Чтение (по строкам):  ${r.rowTime.toFixed(2)}ms`);
    console.log(`     Чтение (по столбцам): ${r.colTime.toFixed(2)}ms`);
    console.log(`     Случайное чтение:     ${r.randTime.toFixed(2)}ms`);
    console.log("");
  }
}
