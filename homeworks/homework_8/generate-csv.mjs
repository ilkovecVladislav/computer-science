/*! 
Генератор CSV файлов для теста

Использование:
  node generate-csv.mjs [опции]

Опции:
  --rows, -n <число>        Количество строк (по умолчанию 100)
  --output, -o <файл>       Имя выходного файла (по умолчанию data.csv)
  --compress, -c <типы>     Сжатие: zip, br (brotli), gz (gzip) через запятую
  --compress-all            Сжать всеми методами (zip, br, gz)
  --help, -h                Показать эту справку

Примеры:
  # Только генерация
  node generate-csv.js -n 1000 -o users.csv

  # Генерация + Brotli сжатие
  node generate-csv.js -n 10000 -c br

  # Генерация + ZIP и Brotli
  node generate-csv.js -n 50000 -c zip,br

  # Сжать всеми методами
  node generate-csv.js -n 1000000 --compress-all

Форматы сжатия:
  zip  - ZIP архив (альбомный формат, хорошая совместимость)
  br   - Brotli (лучшее сжатие, поддерживается современными браузерами)
  gz   - Gzip (отличная совместимость, чуть хуже сжатие чем Brotli)

Требования:
  Для ZIP сжатия требуется установка: npm install archiver
  Brotli и Gzip работают без дополнительных зависимостей
*/

import * as fs from "node:fs";
import * as zlib from "node:zlib";
import { pipeline } from "node:stream/promises";
import archiver from "archiver";

main().catch(console.error);

async function main() {
  const args = process.argv.slice(2);

  let count = 100;
  let output = "data.csv";
  let compress = []; // 'zip', 'br', 'gz'

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--rows" || args[i] === "-n") {
      count = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--output" || args[i] === "-o") {
      output = args[i + 1];
      i++;
    } else if (args[i] === "--compress" || args[i] === "-c") {
      const compressTypes = args[i + 1].split(",");
      compress = compressTypes.map((c) => c.trim().toLowerCase());
      i++;
    } else if (args[i] === "--compress-all") {
      compress = ["zip", "br", "gz"];
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Использование:
  node generate-csv.mjs [опции]

Опции:
  --rows, -n <число>        Количество строк (по умолчанию 100)
  --output, -o <файл>       Имя выходного файла (по умолчанию data.csv)
  --compress, -c <типы>     Сжатие: zip, br (brotli), gz (gzip) через запятую
  --compress-all            Сжать всеми методами (zip, br, gz)
  --help, -h                Показать эту справку

Примеры:
  # Только генерация
  node generate-csv.js -n 1000 -o users.csv

  # Генерация + Brotli сжатие
  node generate-csv.js -n 10000 -c br

  # Генерация + ZIP и Brotli
  node generate-csv.js -n 50000 -c zip,br

  # Сжать всеми методами
  node generate-csv.js -n 1000000 --compress-all

Форматы сжатия:
  zip  - ZIP архив (альбомный формат, хорошая совместимость)
  br   - Brotli (лучшее сжатие, поддерживается современными браузерами)
  gz   - Gzip (отличная совместимость, чуть хуже сжатие чем Brotli)

Требования:
  Для ZIP сжатия требуется установка: npm install archiver
  Brotli и Gzip работают без дополнительных зависимостей
        `);
      process.exit(0);
    }
  }

  // Автоматически выбираем расширение
  if (!output.includes(".")) {
    output = `${output}.csv`;
  }

  console.log(`\n📝 Параметры: ${count.toLocaleString()} строк → ${output}`);

  if (compress.length > 0) {
    console.log(`🗜️  Сжатие: ${compress.join(", ").toUpperCase()}`);
  }

  console.log("");

  // Запускаем генерацию
  const result = await generateCsvStream(count, output);

  // Сжатие
  if (compress.length > 0 && result) {
    console.log(`\n🗜️  Начинаем сжатие...\n`);

    for (const method of compress) {
      try {
        if (method === "br" || method === "brotli") {
          await compressToBrotli(result.file);
        } else if (method === "gz" || method === "gzip") {
          await compressToGzip(result.file);
        } else if (method === "zip") {
          if (archiver) {
            await compressToZip(result.file);
          } else {
            console.error(
              `❌ ZIP сжатие пропущено: установите 'npm install archiver'`,
            );
          }
        } else {
          console.warn(`⚠️  Неизвестный метод сжатия: ${method}`);
        }
      } catch (err) {
        console.error(`❌ Ошибка при сжатии ${method}: ${err.message}`);
      }
    }

    console.log(`\n✅ Все операции завершены!`);
  }

  console.log("");

  // Справка по установке зависимостей
  if (compress.includes("zip") && !archiver) {
    console.log(`💡 Для ZIP сжатия выполните: npm install archiver\n`);
  }
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool() {
  return Math.random() > 0.5;
}

function generateName() {
  const firstNames = [
    "James",
    "Mary",
    "John",
    "Patricia",
    "Robert",
    "Jennifer",
    "Michael",
    "Linda",
    "William",
    "Elizabeth",
    "David",
    "Susan",
    "Richard",
    "Jessica",
    "Joseph",
    "Sarah",
    "Thomas",
    "Karen",
    "Charles",
    "Nancy",
    "Christopher",
    "Lisa",
    "Daniel",
    "Betty",
    "Matthew",
    "Margaret",
    "Anthony",
    "Sandra",
    "Donald",
    "Ashley",
    "Mark",
    "Kimberly",
    "Paul",
    "Emily",
    "Steven",
    "Donna",
    "Andrew",
    "Michelle",
    "Kenneth",
    "Dorothy",
    "Joshua",
    "Carol",
    "Kevin",
    "Amanda",
    "Brian",
    "Melissa",
    "George",
    "Deborah",
    "Edward",
    "Stephanie",
    "Ronald",
    "Rebecca",
    "Timothy",
    "Laura",
    "Jason",
    "Helen",
    "Jeffrey",
    "Sharon",
    "Ryan",
    "Cynthia",
    "Jacob",
    "Kathleen",
    "Gary",
    "Anna",
    "Nicholas",
    "Shirley",
    "Eric",
    "Amy",
    "Jonathan",
    "Angela",
    "Stephen",
    "Ruth",
    "Larry",
    "Emma",
    "Justin",
    "Brenda",
    "Scott",
    "Pamela",
    "Brandon",
    "Nicole",
    "Benjamin",
    "Katherine",
    "Samuel",
    "Virginia",
    "Gregory",
    "Catherine",
    "Frank",
  ];

  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Hall",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Carter",
    "Roberts",
    "Gomez",
    "Phillips",
    "Evans",
    "Turner",
    "Diaz",
    "Parker",
    "Cruz",
    "Edwards",
    "Collins",
    "Reyes",
    "Stewart",
    "Morris",
    "Morales",
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

function generateEmail(firstName, lastName) {
  const domains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "proton.me",
    "icloud.com",
    "aol.com",
    "example.com",
  ];

  const domain = domains[Math.floor(Math.random() * domains.length)];
  const r = Math.random();

  if (r < 0.3)
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  if (r < 0.6)
    return `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`;
  if (r < 0.8) return `${firstName.toLowerCase()}${random(1, 999)}@${domain}`;

  return `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`;
}

function generateTimestamps() {
  const minRegistered = new Date(2015, 0, 1).getTime();
  const maxRegistered = new Date(2024, 11, 31).getTime();

  const registered = random(minRegistered, maxRegistered);
  const today = new Date(2026, 3, 28).getTime();
  const lastSeen = random(registered, today);

  return { registered, lastSeen };
}

function generateScore() {
  const r = Math.random();

  if (r < 0.1) return random(0, 30);
  if (r < 0.35) return random(31, 60);
  if (r < 0.75) return random(61, 85);

  return random(86, 100);
}

function generateRow(id) {
  const { firstName, lastName, fullName } = generateName();
  const email = generateEmail(firstName, lastName);
  const { registered, lastSeen } = generateTimestamps();

  return [
    id,
    randomBool() ? "TRUE" : "FALSE",
    generateScore(),
    fullName,
    email,
    randomBool() ? "TRUE" : "FALSE",
    registered,
    lastSeen,
  ].join(",");
}

// Сжатие в Brotli
async function compressToBrotli(inputFile, outputFile = null, options = {}) {
  if (!outputFile) {
    outputFile = `${inputFile}.br`;
  }

  console.log(`🗜️  Сжатие Brotli: ${inputFile} → ${outputFile}`);
  const startTime = Date.now();

  const source = fs.createReadStream(inputFile);
  const destination = fs.createWriteStream(outputFile);

  const brotli = zlib.createBrotliCompress({
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]:
        options.quality || zlib.constants.BROTLI_MAX_QUALITY,
    },
  });

  await pipeline(source, brotli, destination);

  const originalSize = fs.statSync(inputFile).size;
  const compressedSize = fs.statSync(outputFile).size;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
  const time = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(
    `   ✅ Brotli: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${ratio}% экономии) ⏱️ ${time}с`,
  );

  return { outputFile, originalSize, compressedSize, ratio, time };
}

// Сжатие в Gzip
async function compressToGzip(inputFile, outputFile = null, options = {}) {
  if (!outputFile) {
    outputFile = `${inputFile}.gz`;
  }

  console.log(`🗜️  Сжатие Gzip: ${inputFile} → ${outputFile}`);
  const startTime = Date.now();

  const source = fs.createReadStream(inputFile);
  const destination = fs.createWriteStream(outputFile);
  const gzip = zlib.createGzip({ level: options.level || 9 });

  await pipeline(source, gzip, destination);

  const originalSize = fs.statSync(inputFile).size;
  const compressedSize = fs.statSync(outputFile).size;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
  const time = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(
    `   ✅ Gzip: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${ratio}% экономии) ⏱️ ${time}с`,
  );

  return { outputFile, originalSize, compressedSize, ratio, time };
}

// Сжатие в ZIP
async function compressToZip(inputFile, outputFile = null, options = {}) {
  if (!outputFile) {
    outputFile = `${inputFile}.zip`;
  }

  console.log(`🗜️  Сжатие ZIP: ${inputFile} → ${outputFile}`);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFile);

    const archive = archiver("zip", {
      zlib: { level: options.level || 9 },
    });

    archive.pipe(output);

    output.on("close", () => {
      const originalSize = fs.statSync(inputFile).size;
      const compressedSize = archive.pointer();
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
      const time = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(
        `   ✅ ZIP: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${ratio}% экономии) ⏱️ ${time}с`,
      );
      resolve({ outputFile, originalSize, compressedSize, ratio, time });
    });

    archive.on("error", (err) => {
      console.error(`   ❌ Ошибка ZIP: ${err.message}`);
      reject(err);
    });

    archive.file(inputFile, { name: inputFile.split("/").pop() });
    archive.finalize();
  });
}

async function generateCsvStream(rowsCount = 100, outputFile = "data.csv") {
  console.log(
    `🚀  Генерация ${rowsCount.toLocaleString()} строк в потоковом режиме...`,
  );

  const writeStream = fs.createWriteStream(outputFile, {
    encoding: "utf8",
    highWaterMark: 64 * 1024, // 64KB буфер
  });

  // Записываем заголовки
  const headers = [
    "id",
    "active",
    "score",
    "name",
    "email",
    "verified",
    "registered_ms",
    "last_seen_ms",
  ];
  writeStream.write(headers.join(",") + "\n");

  let rowCount = 0;
  let lastProgress = 0;
  const startTime = Date.now();

  // Функция для записи с контролем backpressure
  function writeRow(row) {
    return new Promise((resolve) => {
      const canWrite = writeStream.write(row + "\n");

      if (!canWrite) {
        writeStream.once("drain", resolve);
      } else {
        resolve();
      }
    });
  }

  // Генерируем и пишем строки
  for (let i = 1; i <= rowsCount; i++) {
    const row = generateRow(i);
    await writeRow(row);
    rowCount++;

    // Прогресс (каждые 1% или 10000 строк)
    const progress = Math.floor((i / rowsCount) * 100);

    if (progress >= lastProgress + 1 || i % 10000 === 0) {
      lastProgress = progress;
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = Math.round(i / elapsed);
      process.stdout.write(
        `\r📊  Прогресс: ${progress}% (${i.toLocaleString()}/${rowsCount.toLocaleString()}) • ${rate.toLocaleString()} строк/сек`,
      );
    }
  }

  // Закрываем стрим
  writeStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const fileSize = (fs.statSync(outputFile).size / (1024 * 1024)).toFixed(
        2,
      );
      console.log(`\n✅ CSV сохранён в ${outputFile}`);
      console.log(`📁  Размер: ${fileSize} MB`);
      console.log(`⏱️  Время: ${totalTime} сек`);
      console.log(
        `📈  Средняя скорость: ${Math.round(rowCount / totalTime).toLocaleString()} строк/сек`,
      );
      resolve({
        file: outputFile,
        size: parseFloat(fileSize),
        time: parseFloat(totalTime),
      });
    });

    writeStream.on("error", (err) => {
      console.error(`❌ Ошибка записи: ${err.message}`);
      reject(err);
    });
  });
}
