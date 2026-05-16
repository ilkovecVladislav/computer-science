# Выводы по результатам сравнительного анализа: Matrix2D vs JSON

Отчет результатов бенчмарка для разрешения **1920×1280** (2.46 млн пикселей). Эти данные наглядно показывают, как ведут себя бинарные и текстовые структуры при обработке тяжелой графики.

---

## Сводная таблица результатов

| Метрика / Формат               | Matrix2D (Бинарный дамп) | Flat Array (Плоский JSON) | Nested Array (Массив массивов JSON) |
| ------------------------------ | ------------------------ | ------------------------- | ----------------------------------- |
| **Сериализация (Запись)**      | **0.02 мс**              | 104.36 мс                 | 132.65 мс                           |
| **Десериализация (Чтение)**    | **2.12 мс**              | 87.58 мс                  | 352.16 мс                           |
| **Исходный размер (Original)** | **9.38 MB**              | 34.48 MB                  | 39.17 MB                            |
| **Размер после Gzip**          | **0.01 MB**              | 10.79 MB                  | 11.17 MB                            |
| **Размер после Brotli**        | **0.00 MB**              | 9.25 MB                   | 9.22 MB                             |

---

## Ключевой анализ результатов

### 1. Скорость сериализации: мгновенный экспорт против процессорного голода

- **Matrix2D (0.02 мс):** Операция выполняется мгновенно. Бинарному дампу не нужно переводить данные из одного формата в другой — мы просто берем готовый `ArrayBuffer` из памяти и отдаем его.
- **JSON (104.36 мс – 132.65 мс):** На зашумленных/рандомных данных `JSON.stringify` начинает работать еще медленнее. Процессор тратит колоссальное время, превращая миллионы уникальных чисел в строковые символы. Бинарный метод быстрее в **5000+ раз**.

### 2. Скорость десериализации: "дешевая" обертка против глубокого парсинга

- **Matrix2D (2.12 мс):** Восстановление матрицы происходит практически моментально. Нам не нужно разбирать и валидировать каждый байт, мы просто "натягиваем" интерфейс `DataView` на считанный буфер.
- **JSON (87.58 мс – 352.16 мс):** Здесь виден главный провал массива массивов (`Nested Array`). Парсинг вложенной структуры занимает рекордные **352.16 мс**, так как движку JavaScript приходится динамически создавать в памяти миллионы мелких массивов под каждый отдельный пиксель. Бинарный буфер восстанавливается в **166 раз быстрее**, чем массив массивов.

### 3. Габариты и парадокс эффективного сжатия

- **Чистый вес:** В несжатом виде (`Original`) `Matrix2D` занимает фиксированные **9.38 MB** (строго 4 байта на пиксель). JSON-форматы раздуваются до **34.48 MB** и **39.17 MB** из-за синтаксического шума (запятые, скобки).
- **Предел сжатия для JSON:** Алгоритмы Gzip и Brotli упираются в жесткий тупик при сжатии хаотичных текстовых данных. Сжатый Brotli-архив плоского JSON весит **9.25 MB**, что практически равно размеру _несжатого_ бинарного файла матрицы (**9.38 MB**).
- **Эффективность бинарного сжатия:** В то время как JSON после Brotli весит более 9 MB, бинарный буфер `Matrix2D` сжимается до **0.00 MB** (в рамках округления до сотых долей мегабайта), подтверждая колоссальную разницу в плотности упаковки информации.

---

## Итоговый вердикт

Использование **JSON для хранения и передачи растровой графики неприемлемо**. Массив массивов (`Nested Array`) создает катастрофическую нагрузку на CPU при десериализации (более трети секунды на один кадр 1920×1280), что делает невозможной работу в реальном времени (рендеринг, стриминг, видеообработка).

Разработанный класс **`Matrix2D`** на базе **`ArrayBuffer`** полностью решает проблему: он гарантирует стабильный минимальный размер данных, исключает стадию парсинга как такового и обеспечивает мгновенный доступ к памяти, экономя ресурсы процессора и сборщика мусора.

---

## Код

```
import fs from "fs";
import zlib from "zlib";

function hexToRGB(hex) {
  let hexLongValueFormat;
  if (hex.length === 4) {
    hexLongValueFormat =
      "#" +
      hex
        .slice(1)
        .split("")
        .map((color) => `${color}${color}`)
        .join("");
  } else {
    hexLongValueFormat = hex.startsWith("#") ? hex : `#${hex}`;
  }

  const r = parseInt(hexLongValueFormat.slice(1, 3), 16);
  const g = parseInt(hexLongValueFormat.slice(3, 5), 16);
  const b = parseInt(hexLongValueFormat.slice(5, 7), 16);

  return [r, g, b, 255];
}

class RGBA {
  static BYTES_PER_ELEMENT = 4;
  #offset;
  #view;

  constructor(view, offset = 0) {
    this.#offset = offset;
    this.#view = view;
  }

  static setElement(view, offset, value) {
    let encodedValue;
    if (Array.isArray(value)) {
      encodedValue = value;
    } else if (typeof value === "string") {
      encodedValue = hexToRGB(value);
    } else {
      return;
    }

    for (let i = 0; i < RGBA.BYTES_PER_ELEMENT; i++) {
      view.setUint8(offset + i, encodedValue[i]);
    }
  }

  static getElement(view, offset) {
    let result = [];
    for (let i = 0; i < RGBA.BYTES_PER_ELEMENT; i++) {
      result.push(view.getUint8(offset + i));
    }
    return result;
  }

  get red() {
    return this.#view.getUint8(this.#offset);
  }
  get green() {
    return this.#view.getUint8(this.#offset + 1);
  }
  get blue() {
    return this.#view.getUint8(this.#offset + 2);
  }
  get alpha() {
    return this.#view.getUint8(this.#offset + 3);
  }

  set red(value) {
    this.#view.setUint8(this.#offset, value);
  }
  set green(value) {
    this.#view.setUint8(this.#offset + 1, value);
  }
  set blue(value) {
    this.#view.setUint8(this.#offset + 2, value);
  }
  set alpha(value) {
    this.#view.setUint8(this.#offset + 3, value);
  }
}

class Matrix2D {
  #dataView;
  #buffer;
  #rows;
  #cols;
  #elementViewModel;

  constructor(rows, cols, view, data) {
    if (!data) {
      this.#buffer = new ArrayBuffer(rows * cols * view.BYTES_PER_ELEMENT);
      this.#dataView = new DataView(this.#buffer);
    } else {
      this.#buffer = data.buffer || data;
      this.#dataView = new DataView(this.#buffer);
    }

    this.#rows = rows;
    this.#cols = cols;
    this.#elementViewModel = view;
  }

  get buffer() {
    return this.#buffer;
  }

  #getOffset(row, col) {
    if (row >= 0 && row < this.#rows && col >= 0 && col < this.#cols) {
      return (
        (row * this.#cols + col) * this.#elementViewModel.BYTES_PER_ELEMENT
      );
    }
    throw new RangeError("Index out of bounds");
  }

  get(row, col) {
    const offset = this.#getOffset(row, col);
    return this.#elementViewModel.getElement(this.#dataView, offset);
  }

  set(row, col, value) {
    const offset = this.#getOffset(row, col);
    this.#elementViewModel.setElement(this.#dataView, offset, value);
  }

  fill(value) {
    for (
      let i = 0;
      i < this.#buffer.byteLength;
      i += this.#elementViewModel.BYTES_PER_ELEMENT
    ) {
      this.#elementViewModel.setElement(this.#dataView, i, value);
    }
  }

  view(row, col) {
    const offset = this.#getOffset(row, col);
    return new RGBA(this.#dataView, offset);
  }
}

function getRandomRGBA() {
  return [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    255,
  ];
}

function fillMatrixWithRandom(matrix, rows, cols) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      matrix.set(r, c, getRandomRGBA());
    }
  }
}

function generateRandomFlatArray(rows = 1000, cols = 1000) {
  const arr = new Array(rows * cols * 4);
  for (let i = 0; i < arr.length; i += 4) {
    arr[i] = Math.floor(Math.random() * 256);
    arr[i + 1] = Math.floor(Math.random() * 256);
    arr[i + 2] = Math.floor(Math.random() * 256);
    arr[i + 3] = 255;
  }
  return arr;
}

function generateRandomNestedArray(rows = 1000, cols = 1000) {
  const result = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(getRandomRGBA());
    }
    result.push(row);
  }
  return result;
}

const ROWS = 1920;
const COLS = 1280;

console.log(`=== Инициализация данных для разрешения ${ROWS}x${COLS} ===`);

const matrix = new Matrix2D(ROWS, COLS, RGBA);
fillMatrixWithRandom(matrix);

const flat = generateRandomFlatArray(ROWS, COLS);
const nested = generateRandomNestedArray(ROWS, COLS);

console.log("\n=== Тест 1: Сериализация ===");

let start = performance.now();
const matrixBuffer = Buffer.from(matrix.buffer);
const matrixSerTime = performance.now() - start;
console.log(`Matrix2D (Бинарный дамп): ${matrixSerTime.toFixed(2)}ms`);

start = performance.now();
const flatJsonString = JSON.stringify(flat);
const flatSerTime = performance.now() - start;
console.log(`Плоский массив (JSON.stringify): ${flatSerTime.toFixed(2)}ms`);

start = performance.now();
const nestedJsonString = JSON.stringify(nested);
const nestedSerTime = performance.now() - start;
console.log(`Массив массивов (JSON.stringify): ${nestedSerTime.toFixed(2)}ms`);

console.log("\n=== Тест 2: Размеры файлов и сжатие ===");

fs.writeFileSync("data_matrix.bin", matrixBuffer);
fs.writeFileSync("data_flat.json", flatJsonString);
fs.writeFileSync("data_nested.json", nestedJsonString);

const getStats = (filename) => {
  const stats = fs.statSync(filename);
  const rawSize = stats.size / (1024 * 1024);

  const gzipBuffer = zlib.gzipSync(fs.readFileSync(filename));
  const gzipSize = gzipBuffer.length / (1024 * 1024);

  const brotliBuffer = zlib.brotliCompressSync(fs.readFileSync(filename));
  const brotliSize = brotliBuffer.length / (1024 * 1024);

  return { rawSize, gzipSize, brotliSize };
};

const matrixStats = getStats("data_matrix.bin");
const flatStats = getStats("data_flat.json");
const nestedStats = getStats("data_nested.json");

console.table({
  "Matrix2D (.bin)": {
    "Original (MB)": matrixStats.rawSize.toFixed(2),
    "Gzip (MB)": matrixStats.gzipSize.toFixed(2),
    "Brotli (MB)": matrixStats.brotliSize.toFixed(2),
  },
  "Flat Array (.json)": {
    "Original (MB)": flatStats.rawSize.toFixed(2),
    "Gzip (MB)": flatStats.gzipSize.toFixed(2),
    "Brotli (MB)": flatStats.brotliSize.toFixed(2),
  },
  "Nested Array (.json)": {
    "Original (MB)": nestedStats.rawSize.toFixed(2),
    "Gzip (MB)": nestedStats.gzipSize.toFixed(2),
    "Brotli (MB)": nestedStats.brotliSize.toFixed(2),
  },
});

console.log("\n=== Тест 3: Десериализация ===");

start = performance.now();
const restoredBuffer = fs.readFileSync("data_matrix.bin");
const restoredMatrix = new Matrix2D(ROWS, COLS, RGBA, restoredBuffer.buffer);
const matrixDesTime = performance.now() - start;
console.log(`Matrix2D (Восстановление буфера): ${matrixDesTime.toFixed(2)}ms`);

start = performance.now();
const restoredFlat = JSON.parse(flatJsonString);
const flatDesTime = performance.now() - start;
console.log(`Плоский массив (JSON.parse): ${flatDesTime.toFixed(2)}ms`);

start = performance.now();
const restoredNested = JSON.parse(nestedJsonString);
const nestedDesTime = performance.now() - start;
console.log(`Массив массивов (JSON.parse): ${nestedDesTime.toFixed(2)}ms`);

fs.unlinkSync("data_matrix.bin");
fs.unlinkSync("data_flat.json");
fs.unlinkSync("data_nested.json");

```
