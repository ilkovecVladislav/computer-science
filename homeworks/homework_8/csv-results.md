# Результаты сравнения производительности: CSV vs JSON

## Общая информация

Измерения проводились на наборе данных из **1 000 000 записей**.
Цель теста — выявить разницу между потоковой обработкой текстовых данных (Streaming) и полной загрузкой объекта в память (Batch Parsing).

### Сравнение размеров файлов

| Формат   | Размер на диске | Избыточность              |
| -------- | --------------- | ------------------------- |
| **CSV**  | **81.28 MB**    | 0% (базовый)              |
| **JSON** | **194.78 MB**   | ~140% (в 2.4 раза больше) |

> **Почему такая разница?**
> CSV хранит только значения. JSON вынужден повторять названия ключей (например, `"id":`, `"fullName":`) для каждой из миллиона записей, что приводит к колоссальному увеличению объема данных при хранении и передаче по сети.

---

### Таблица измерений

| Показатель        | Время до первой записи | Общее время парсинга | Heap Used (прирост) | RSS (итого)  |
| ----------------- | ---------------------- | -------------------- | ------------------- | ------------ |
| **CSV Streaming** | **2.08 ms**            | **364.92 ms**        | **2.64 MB**         | **56.96 MB** |
| **JSON Native**   | 582.95 ms              | 583.00 ms            | 382.99 MB           | 506.02 MB    |

---

## Сравнительный анализ

### 1. Скорость реакции (Latency)

CSV Streaming показал результат в **278 раз быстрее**, чем JSON, в категории «время до первой записи».

- **CSV** начинает отдавать данные почти мгновенно после чтения первого байта.
- **JSON** блокирует выполнение потока почти на 600 мс, так как не может выдать результат, пока не просканирует файл до последнего символа `]`.

### 2. Потребление ресурсов (Memory Footprint)

Разница в потреблении оперативной памяти (RSS) составляет почти **9 раз**:

- **CSV** работает в «проточном» режиме. Ему не нужно держать в памяти весь массив; он обрабатывает одну строку и тут же освобождает место. Прирост кучи (Heap) в **2.64 MB** — это лишь временные буферы чтения.
- **JSON** потребовал **382.99 MB** в куче только для хранения объектов. Это создает огромную нагрузку на сборщик мусора (Garbage Collector) и может привести к зависанию приложения при параллельных запросах.

### 3. Эффективность парсинга

Несмотря на то, что `JSON.parse` реализован на уровне движка V8, CSV парсер на JavaScript обошел его по общему времени выполнения (**364 мс** против **583 мс**).
Это связано с тем, что создание миллиона JS-объектов — крайне «дорогая» операция для процессора, которой удается избежать при потоковом чтении CSV.

## Итоговое заключение

## **JSON медленнее в 1.6 раза** по общему времени, но в **сотни раз медленнее** по времени отклика. Для обработки больших объемов данных (Big Data, логи, экспорт/импорт) использование **CSV Streaming** является единственным профессиональным решением, позволяющим сохранять стабильность системы при минимальных затратах ресурсов.

Вот твой обновленный отчет, основанный исключительно на **твоих** актуальных замерах. Теперь он выглядит как полноценное техническое исследование «золотой середины» между скоростью и размером.

---

# Отчет: Эффективность сжатия CSV vs JSON (1 000 000 записей)

## 1. Сравнение исходных данных

Перед началом сжатия мы имеем колоссальный разрыв в объеме:

- **CSV:** 81.29 MB (базовый стандарт)
- **JSON:** 194.78 MB (**в 2.4 раза больше**)

---

## 2. Сравнительная таблица (Level 5 vs Level 9)

Здесь наглядно видно, сколько времени мы тратим на каждый сэкономленный мегабайт.

| Формат   | Алгоритм   | Уровень 5 (Размер / Время) | Уровень 9 (Размер / Время) | Профит от Level 9            |
| -------- | ---------- | -------------------------- | -------------------------- | ---------------------------- |
| **CSV**  | **ZIP**    | 27.52 MB / 1.46с           | 27.40 MB / 3.53с           | -0.12 MB (📉 время x2.4)     |
| **CSV**  | **Gzip**   | 27.52 MB / 1.54с           | 27.40 MB / 3.72с           | -0.12 MB (📉 время x2.4)     |
| **CSV**  | **Brotli** | **27.23 MB / 2.42с**       | **23.96 MB / 8.00с**       | **-3.27 MB** (📉 время x3.3) |
|          |            |                            |                            |                              |
| **JSON** | **ZIP**    | 33.91 MB / 1.31с           | 31.42 MB / 6.75с           | -2.49 MB (📉 время x5.1)     |
| **JSON** | **Gzip**   | 33.91 MB / 1.30с           | 31.42 MB / 6.58с           | -2.49 MB (📉 время x5.0)     |
| **JSON** | **Brotli** | **31.52 MB / 2.30с**       | **27.50 MB / 11.87с**      | **-4.02 MB** (📉 время x5.1) |

---

## 3. Анализ эффективности

### 🎯 "Золотая середина" (Level 5)

На 5-м уровне сжатия результаты для динамических систем:

- **Gzip/ZIP** показывают идентичную эффективность. Они работают молниеносно (~1.3–1.5с).
- **Brotli** на 5-м уровне уже обходит конкурентов по размеру, при этом оставаясь в рамках комфортных 2.3–2.4 секунд. Это лучший выбор для передачи данных в браузер.

### 🐢 Level 9

- Для **CSV** переход на Level 9 в ZIP/Gzip практически бессмыслен: ты выигрываешь ничтожные 120 КБ, но платишь за это двойным временем ожидания.
- **Brotli Level 9** — единственный, кто дает реальный прирост (минус 3.2–4.0 MB), но время обработки улетает за 10 секунд для JSON.

---

## 4. Главный парадокс сжатия

1. **CSV (Level 5, Brotli):** 27.23 MB
2. **JSON (Level 9, Brotli):** 27.50 MB

**Вывод:** Максимально сжатый JSON в итоге весит столько же, сколько умеренно сжатый CSV. Алгоритмы сжатия практически полностью «нивелируют» избыточность JSON (кавычки, скобки, ключи), сводя разницу между форматами к минимуму.

---

## 5. Итоговые выводы

1. **Для WEB (API):** **Brotli Level 5**. Он дает идеальный баланс: файлы в 3 раза меньше оригинала всего за 2.3 секунды.
2. **Для архивации:** Смысл имеет только **Brotli Level 9**. Он единственный эффективно дожимает данные, когда время не критично.
3. **JSON vs CSV:** JSON необходимо сжимать. Если передавать JSON «как есть» (194 MB), ты загрузишь сеть в 2.4 раза сильнее. После сжатия (Brotli) JSON становится всего на **15%** тяжелее CSV.
4. **ZIP и Gzip:** Практически идентичны. Для сетевых ответов лучше выбирать Gzip (он нативнее для HTTP).

---

## Реализация парсеров

```
import * as fs from "node:fs";
import * as readline from "node:readline";

const CSV_FILE = "./users.csv";
const JSON_FILE = "./users.json";
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
 * Нативный JSON парсер
 */
function parseJSONNative(filePath) {
  const startTime = performance.now();
  const content = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(content);
  const latency = performance.now() - startTime;
  return { rowCount: data.length, firstRecordTime: latency };
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

  // Принудительно зовем сборщик мусора перед JSON (нужен флаг --expose-gc)
  if (global.gc) global.gc();

  // 2. Тестируем JSON
  const jsonStats = await benchmarkTask("JSON Native", () =>
    parseJSONNative(JSON_FILE),
  );

  console.table([csvStats, jsonStats]);

  const speedDiff = (jsonStats.rawTime / csvStats.rawTime).toFixed(1);
  console.log(`\n💡 ИТОГ: JSON медленнее в ${speedDiff} раза.`);
}

runTheShowdown().catch((err) => {
  if (err.code === "ENOENT") {
    console.error("❌ Ошибка: Файлы не найдены. Сначала запусти генератор!");
  } else {
    console.error("💥 Произошла системная ошибка:", err);
  }
});

```
