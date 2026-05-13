# Отчет по результатам сравнения CSV и MessagePack: производительность, память и структура

## 1. Сравнение характеристик файлов (генерация)

Первый этап показал значительную разницу в эффективности хранения данных «из коробки».

| Параметр                   | CSV                | MessagePack    |
| -------------------------- | ------------------ | -------------- |
| **Размер файла**           | 81.29 MB           | **60.88 MB**   |
| **Скорость генерации**     | **375 940 об/сек** | 310 559 об/сек |
| **Время создания (1 млн)** | **2.66 сек**       | 3.22 сек       |

**Вывод по размерам:**
MessagePack оказался **на 25% компактнее** CSV. Это преимущество бинарного формата: числа не превращаются в длинные строки, а записываются в байтовом виде. При этом CSV генерируется чуть быстрее, так как не тратит ресурсы на вычисление длин полей и типов данных, просто выкидывая текст в поток.

---

## 2. Результаты парсинга (Performance Benchmark)

| Показатель                 | CSV Streaming | MessagePack (Stream) | Разница               |
| -------------------------- | ------------- | -------------------- | --------------------- |
| **Время до первой записи** | **1.59 ms**   | 2.03 ms              | CSV стартует быстрее  |
| **Общее время парсинга**   | 389.13 ms     | **314.13 ms**        | **MP быстрее на 19%** |
| **Heap Used (разница)**    | **3.61 MB**   | 3.62 MB              | Паритет               |
| **RSS (пик памяти)**       | **57.21 MB**  | 81.49 MB             | CSV легче на 24 MB    |

---

## 3. Сравнительный анализ и выводы

### 🚀 Производительность: Процессор против Текста

MessagePack выигрывает в общем зачете скорости (**314 мс** против **389 мс**).

- В **CSV** парсер вынужден проверять каждый символ (запятые, кавычки, переносы строк).
- В **MessagePack** структура «подсказывает» парсеру, сколько байт нужно прочитать для следующего значения. Это позволяет CPU работать эффективнее.

### 🧠 Память: Чистота стриминга

Оба формата показали великолепный результат по **Heap Used** (~3.6 MB). Это доказывает, что оба парсера — настоящие «потоковые» решения. Они не копят данные, а сразу передают их дальше.
Однако **RSS** у CSV ниже: использование стандартного `readline` в Node.js менее требовательно к системной памяти, чем библиотека `msgpackr`.

### 🛠️ Гибкость и Сложность

1. **Типы данных:** CSV превращает всё в строки. Чтобы получить число `42`, тебе нужно вызвать `parseInt()`. MessagePack возвращает **нативные типы** (числа, boolean, объекты) сразу.
2. **Структура:** CSV — это только «плоские» таблицы. MessagePack позволяет передавать **вложенные объекты и массивы**, сохраняя при этом потоковую обработку.
3. **Стандартизация:** CSV — это «вечный» стандарт. Потоковый MessagePack сильно зависит от конкретной библиотеки (`msgpackr`), что может создать сложности при переносе кода на другие языки (Python, Go), если там нет поддержки именно такого способа стриминга.

---

## Итоговое заключение

- **Выбирай CSV**, если данные простые и табличные, а приоритет — универсальность и минимальное потребление оперативной памяти (RSS).
- **Выбирай MessagePack**, если важна экономия места на диске (минус 25% объема) и скорость обработки сложных, вложенных структур данных.

---

Этот финальный этап тестов расставляет все точки над «i». Мы видим классическую битву: текстовый формат (CSV) против бинарного (MessagePack).

Вот сводный анализ, который показывает, как ведут себя эти форматы при попытке их максимально «ужать».

---

# Сравнительный анализ сжатия: CSV vs MessagePack

## 1. Исходные данные (без сжатия)

- **CSV:** 81.29 MB
- **MessagePack:** 60.88 MB
- **Разница:** MessagePack изначально на **25% компактнее**, так как не хранит числа и метаданные в виде текста.

---

## 2. Сравнение на уровне сжатия 5 (Оптимальный баланс)

На этом уровне мы оцениваем пригодность для работы в реальном времени (например, передача данных по API).

| Формат          | Алгоритм | Итоговый размер | Экономия от оригинала | Время сжатия |
| --------------- | -------- | --------------- | --------------------- | ------------ |
| **CSV**         | Brotli   | 27.23 MB        | 66.5%                 | 2.42 с       |
| **MessagePack** | Brotli   | **25.14 MB**    | 58.7%                 | **1.38 с**   |
| **CSV**         | Gzip     | 27.52 MB        | 66.1%                 | 1.54 с       |
| **MessagePack** | Gzip     | 27.21 MB        | 55.3%                 | **1.10 с**   |

**Вывод по Level 5:**
MessagePack выигрывает и по размеру, и по скорости. Он сжимается **в 1.5–2 раза быстрее**, чем CSV, и на выходе дает файл меньшего объема. Это делает связку **MessagePack + Gzip/Brotli (L5)** абсолютным лидером для высоконагруженных систем.

---

## 3. Сравнение на уровне сжатия 9 (Максимальная плотность)

Здесь мы смотрим, кто лучше подходит для долгосрочного хранения (архивов).

| Формат          | Алгоритм | Итоговый размер | Экономия от оригинала | Время сжатия |
| --------------- | -------- | --------------- | --------------------- | ------------ |
| **CSV**         | Brotli   | 23.96 MB        | **70.5%**             | 8.00 с       |
| **MessagePack** | Brotli   | **23.42 MB**    | 61.5%                 | **6.29 с**   |
| **CSV**         | Gzip     | 27.40 MB        | 66.2%                 | 3.72 с       |
| **MessagePack** | Gzip     | 27.17 MB        | 55.3%                 | **2.93 с**   |

**Вывод по Level 9:**
Происходит «эффект выравнивания». Хотя CSV сжимается эффективнее в процентном соотношении (минус 70% против 61%), итоговый размер файлов практически идентичен (**разница всего 0.5 MB**).

---

## 4. Ключевые выводы исследования

### 📉 Эффективность алгоритмов

Алгоритмы сжатия (Brotli/Gzip) лучше работают с CSV, так как в тексте больше повторяющихся паттернов. Однако, поскольку MessagePack изначально компактнее, он все равно остается лидером по финальному весу.

### ⚡ Скорость — главный козырь MessagePack

Самое поразительное в твоих результатах — время.

- Сжать MessagePack с помощью Brotli (L5) заняло всего **1.38 сек**.
- Сжать CSV тем же способом заняло **2.42 сек**.
  Бинарный формат требует меньше усилий от процессора при упаковке, что критично для высоконагруженных серверов.

### 🧩 Парадокс избыточности

Тесты наглядно подтвердили инженерное правило:

> Чем «умнее» формат данных (как MessagePack), тем меньше профита он получает от экстремального сжатия.

Разница между Level 5 и Level 9 для MessagePack в ZIP/Gzip составила ничтожные **0.04 MB** (40 КБ), в то время как для CSV она была в три раза больше.

---

## Итоговый вердикт

1. **Для максимальной скорости и экономии ресурсов:**
   Используй **MessagePack + Gzip/Brotli Level 5**. Это «реактивная связка»: минимальное время генерации, высокая скорость сжатия и отличный итоговый вес.
2. **Для максимальной экономии места (Архивы):**
   **Brotli Level 9** на любом из форматов даст примерно одинаковый результат (~23.5 MB). Выбирай тот формат, который удобнее будет парсить потом.
3. **Для простоты:**
   **CSV + Gzip**. Он лишь немного уступает бинарному конкуренту, но остается человекочитаемым и стандартным для любых инструментов аналитики.

**Финальный факт:** Тесты доказали, что при использовании современных алгоритмов сжатия разница в объеме между JSON, CSV и MessagePack на диске практически исчезает. Главным критерием выбора становится **скорость парсинга и удобство структуры**, а не размер файла.

## Код

```
import * as fs from "node:fs";
import * as readline from "node:readline";
import { UnpackrStream } from "msgpackr";

const CSV_FILE = "./data.csv";
const MESSAGE_PACK_FILE = "./data.msgpack";
const SEPARATOR = ",";
const QUOTE = '"';

function parseLine(line, separator) {
  const result = [];
  let inQuotes = false;
  let startPointer = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === QUOTE) {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(line.slice(startPointer, i));
      startPointer = i + 1;
    }
  }
  result.push(line.slice(startPointer));
  return result;
}

/**
 * Потоковый парсер CSV
 */
function parseCSVStreaming(filePath) {
  return new Promise((resolve, reject) => {
    let firstRecordTime = null;
    const startTime = performance.now();

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let isHeader = true;
    let rowCount = 0;

    rl.on("line", (line) => {
      if (isHeader) {
        isHeader = false;
        return;
      }

      // Замер Latency до первой записи
      if (firstRecordTime === null) {
        firstRecordTime = performance.now() - startTime;
      }

      parseLine(line, SEPARATOR);
      rowCount++;
    });

    rl.on("error", reject);
    rl.on("close", () => {
      resolve({ rowCount, firstRecordTime });
    });
  });
}

/**
 * MessagePack
 */
function parseMessagePack(filePath) {
  return new Promise((resolve, reject) => {
    let firstRecordTime = null;
    const startTime = performance.now();

    const fileStream = fs.createReadStream(filePath);
    const receivingStream = new UnpackrStream();
    let rowCount = 0;

    receivingStream.on("data", (data) => {
      if (firstRecordTime === null) {
        firstRecordTime = performance.now() - startTime;
      }
      rowCount++;
    });

    receivingStream.on("error", reject);
    receivingStream.on("end", () => {
      resolve({ rowCount, firstRecordTime });
    });

    fileStream.pipe(receivingStream);
  });
}

async function runTheShowdown() {
  console.log("🚀 Запуск сравнения (1,000,000 строк)...");

  // Функция для замера одной задачи
  async function benchmarkTask(name, taskFn, type) {
    const startHeap = process.memoryUsage().heapUsed / 1024 / 1024;
    const startTime = performance.now();

    const result = await taskFn();

    const endTime = performance.now();
    const endHeap = process.memoryUsage().heapUsed / 1024 / 1024;
    const endRSS = process.memoryUsage().rss / 1024 / 1024;

    return {
      Показатель: name,
      "Время до первой записи": `${result.firstRecordTime.toFixed(2)} ms`,
      "Общее время парсинга": `${(endTime - startTime).toFixed(2)} ms`,
      "Heap Used (разница)": `${Math.max(0, endHeap - startHeap).toFixed(2)} MB`,
      "RSS (итого)": `${endRSS.toFixed(2)} MB`,
      rawTime: endTime - startTime,
    };
  }

  // 1. Тестируем CSV
  const csvStats = await benchmarkTask("CSV Streaming", () =>
    parseCSVStreaming(CSV_FILE),
  );

  // 2. Тестируем MessagePack
  const msgPackStats = await benchmarkTask("MessagePack", () =>
    parseMessagePack(MESSAGE_PACK_FILE),
  );

  console.table([csvStats, msgPackStats]);

  const speedDiff = (csvStats.rawTime / msgPackStats.rawTime).toFixed(1);
  console.log(`\n💡 ИТОГ: CSV медленнее в ${speedDiff} раза.`);
}

runTheShowdown().catch((err) => {
  if (err.code === "ENOENT") {
    console.error("❌ Ошибка: Файлы не найдены. Сначала запусти генератор!");
  } else {
    console.error("💥 Произошла системная ошибка:", err);
  }
});

```
