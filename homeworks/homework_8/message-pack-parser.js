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
